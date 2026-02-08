"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const categories = ["Pothole", "Graffiti", "Streetlight", "Trash", "Safety", "Other"];
const defaultCenter: [number, number] = [44.2312, -76.486];

const iconRetinaUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

function PinPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function NewIssuePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setError(null);

    if (!images.length) {
      setError("Please add at least one photo.");
      return;
    }

    setLoading(true);

    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .insert({
        created_by: user.id,
        title,
        description,
        category,
        address,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      })
      .select("id")
      .single();

    if (issueError || !issue) {
      setLoading(false);
      setError(issueError?.message || "Failed to create issue.");
      return;
    }

    const uploads = await Promise.all(
      images.map(async (file) => {
        const fileName = `${crypto.randomUUID()}-${file.name}`;
        const path = `issues/${issue.id}/before/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("issue-media")
          .upload(path, file);

        if (uploadError) {
          // Surface precise storage errors to make setup issues obvious.
          return { error: uploadError };
        }

        const { data: publicUrl } = supabase.storage.from("issue-media").getPublicUrl(path);
        return { url: publicUrl.publicUrl };
      })
    );

    const failed = uploads.find((item) => item.error);
    if (failed?.error) {
      setLoading(false);
      setError(failed.error.message || "Upload failed. Please try again.");
      return;
    }

    const mediaRows = uploads.map((item) => ({
      issue_id: issue.id,
      type: "before",
      url: item.url,
    }));

    const { error: mediaError } = await supabase.from("issue_media").insert(mediaRows);
    if (mediaError) {
      setLoading(false);
      setError(mediaError.message);
      return;
    }

    setLoading(false);
    router.replace(`/issues/${issue.id}`);
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-[var(--font-heading)] text-xl font-semibold">Report an issue</h2>
        <p className="text-sm text-muted">Add details and at least one photo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium">
          Title
          <input
            type="text"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium">
          Description
          <textarea
            required
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
          >
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Address
          <input
            type="text"
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <div className="space-y-2">
          <p className="text-sm font-medium">Drop a pin (optional)</p>
          <div className="surface-card overflow-hidden rounded-2xl">
            <MapContainer
              center={coords ? [coords.lat, coords.lng] : defaultCenter}
              zoom={13}
              className="h-[260px] w-full"
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <PinPicker
                onPick={(lat, lng) => {
                  setCoords({ lat, lng });
                }}
              />
              {coords ? <Marker position={[coords.lat, coords.lng]} /> : null}
            </MapContainer>
          </div>
          <p className="text-xs text-muted">
            Tap the map to place a pin. This helps show the issue on the city map.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Photos (required)</p>
          <label className="surface-accent flex cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--accent)] transition hover:opacity-90">
            Add photos
            <input
              type="file"
              accept="image/*"
              multiple
              required
              onChange={(event) => setImages(Array.from(event.target.files || []))}
              className="hidden"
            />
          </label>
          {images.length ? (
            <p className="text-xs text-muted">{images.length} photo(s) selected</p>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit issue"}
        </button>
      </form>
    </section>
  );
}
