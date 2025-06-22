import React, { useEffect, useState } from "react";
import "./frontend.css";

export default function LatestImage() {
  const [imageUrl, setImageUrl] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useIframe, setUseIframe] = useState(false);

  // Extract the Google Drive file ID and convert to preview/embed link
  const extractFileId = (viewLink) => {
    const match = viewLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    fetch("https://backend-image-kn59.onrender.com/latest-image")
      .then((res) => res.json())
      .then((data) => {
        if (data.url) {
          const fileId = extractFileId(data.url);
          if (fileId) {
            const directLink = `https://drive.usercontent.google.com/download?id=${fileId}`;
            const fallbackIframe = `https://drive.google.com/file/d/${fileId}/preview`;
            setImageUrl(directLink);
            setIframeUrl(fallbackIframe);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching image:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="latest-image-card">
      <h2 className="title">Latest Uploaded Image</h2>

      {loading ? (
        <p className="status loading-text">Loading...</p>
      ) : error ? (
        <p className="status error">❌ No image found or error loading.</p>
      ) : useIframe ? (
        <iframe
          src={iframeUrl}
          width="100%"
          height="500"
          allow="autoplay"
          title="Fallback Image Preview"
          style={{ border: "1px solid #ccc", borderRadius: "8px" }}
        />
      ) : (
        <img
          src={imageUrl}
          alt="Latest Upload"
          className="latest-image"
          onError={() => {
            console.error("❌ Image failed to load:", imageUrl);
            setUseIframe(true); // Fallback to iframe
          }}
        />
      )}
    </div>
  );
}
