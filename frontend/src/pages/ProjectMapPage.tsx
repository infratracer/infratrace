import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects } from "../api/projects";
import { useProjectStore } from "../store/projectStore";
import { useTheme } from "../hooks/useTheme";
import { useIsMobile } from "../hooks/useIsMobile";
import { formatCurrency } from "../utils/format";
import type { Project } from "../types";

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

declare global {
  interface Window {
    L: any;
  }
}

function loadLeaflet(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(); return; }

    // CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // JS
    if (document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const check = setInterval(() => {
        if (window.L) { clearInterval(check); resolve(); }
      }, 50);
      return;
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Leaflet"));
    document.head.appendChild(script);
  });
}

interface ProjectWithCoords extends Project {
  latitude?: number | null;
  longitude?: number | null;
}

export default function ProjectMapPage() {
  const t = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const setProjects = useProjectStore((s) => s.setProjects);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);

  const [projects, setProjectsList] = useState<ProjectWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [leafletReady, setLeafletReady] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const geoProjects = projects.filter(
    (p) => p.latitude != null && p.longitude != null && p.latitude !== 0 && p.longitude !== 0
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const projs = await getProjects();
        setProjectsList(projs as ProjectWithCoords[]);
        setProjects(projs);
      } catch {
        setError("Failed to load projects.");
      } finally {
        setLoading(false);
      }
    })();
  }, [setProjects]);

  useEffect(() => {
    loadLeaflet()
      .then(() => setLeafletReady(true))
      .catch(() => setError("Failed to load map library."));
  }, []);

  const initMap = useCallback(() => {
    if (!leafletReady || !mapRef.current || mapInstanceRef.current) return;
    const L = window.L;

    const defaultCenter: [number, number] =
      geoProjects.length > 0
        ? [geoProjects[0].latitude!, geoProjects[0].longitude!]
        : [-33.8688, 151.2093]; // Sydney fallback

    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: geoProjects.length > 0 ? 6 : 4,
      zoomControl: false,
    });

    L.tileLayer(TILE_URL, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a>',
      maxZoom: 18,
      subdomains: ["a", "b", "c"],
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapInstanceRef.current = map;

    // Add markers
    geoProjects.forEach((p) => {
      const statusColor =
        p.status === "completed" ? "#32D74B" :
        p.status === "active" ? "#0A84FF" :
        p.status === "on_hold" ? "#FF9F0A" : "#8E8E93";

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width: 32px; height: 32px; border-radius: 50%;
          background: ${statusColor};
          border: 3px solid rgba(255,255,255,0.9);
          box-shadow: 0 2px 12px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; color: #fff; font-weight: 700;
          cursor: pointer;
        ">${p.name.charAt(0).toUpperCase()}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([p.latitude!, p.longitude!], { icon }).addTo(map);

      const popup = L.popup({
        closeButton: false,
        className: "infratrace-popup",
        offset: [0, -10],
      }).setContent(`
        <div style="
          background: rgba(28,28,30,0.92);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 14px 16px;
          color: #fff;
          min-width: 180px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">${p.name}</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 11px; color: rgba(255,255,255,0.5);">Status</span>
            <span style="font-size: 11px; font-weight: 500; color: ${statusColor};">${p.status.replace("_", " ")}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 11px; color: rgba(255,255,255,0.5);">Budget</span>
            <span style="font-size: 11px; font-weight: 500;">${formatCurrency(p.budget)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-size: 11px; color: rgba(255,255,255,0.5);">Risk</span>
            <span style="font-size: 11px; font-weight: 500; color: ${
              p.risk_level === "critical" || p.risk_level === "high" ? "#FF453A" :
              p.risk_level === "medium" ? "#FF9F0A" : "#32D74B"
            };">${p.risk_level}</span>
          </div>
        </div>
      `);

      marker.bindPopup(popup);
      marker.on("click", () => setSelectedProject(p.id));
      markersRef.current.push(marker);
    });

    // Fit bounds if multiple projects
    if (geoProjects.length > 1) {
      const bounds = L.latLngBounds(
        geoProjects.map((p) => [p.latitude!, p.longitude!])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Inject custom popup styles to override leaflet defaults
    const style = document.createElement("style");
    style.textContent = `
      .infratrace-popup .leaflet-popup-content-wrapper {
        background: transparent !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
      }
      .infratrace-popup .leaflet-popup-content {
        margin: 0 !important;
      }
      .infratrace-popup .leaflet-popup-tip {
        background: rgba(28,28,30,0.92) !important;
      }
    `;
    document.head.appendChild(style);
  }, [leafletReady, geoProjects]);

  useEffect(() => {
    if (!loading && leafletReady) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(initMap, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, leafletReady, initMap]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const flyToProject = (p: ProjectWithCoords) => {
    setSelectedProject(p.id);
    if (mapInstanceRef.current && p.latitude && p.longitude) {
      mapInstanceRef.current.flyTo([p.latitude, p.longitude], 12, { duration: 1.2 });
      // Open popup for this marker
      const idx = geoProjects.findIndex((gp) => gp.id === p.id);
      if (idx >= 0 && markersRef.current[idx]) {
        markersRef.current[idx].openPopup();
      }
    }
    if (isMobile) setSidebarOpen(false);
  };

  const glass = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: t.bgCard,
    backdropFilter: "blur(60px) saturate(150%)",
    WebkitBackdropFilter: "blur(60px) saturate(150%)",
    border: `0.5px solid ${t.glassBorder}`,
    borderRadius: 16,
    boxShadow: t.glassShadow,
    transition: "all 0.2s ease",
    ...extra,
  });

  const statusColor = (status: string) =>
    status === "completed" ? t.neonGreen :
    status === "active" ? t.accent :
    status === "on_hold" ? t.neonAmber : t.textMuted;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 60px)" }}>
        <div style={{
          width: 28, height: 28, border: `2.5px solid ${t.glassBorder}`,
          borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 60px)" }}>
        <div style={glass({ maxWidth: 380, width: "100%", textAlign: "center", padding: "36px 28px" })}>
          <p style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, marginBottom: 6 }}>Map Error</p>
          <p style={{ fontSize: 13, color: t.textSecondary }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "relative",
      height: "calc(100vh - 60px)",
      margin: "-20px -24px",
      overflow: "hidden",
    }}>
      {/* Map container */}
      <div
        ref={mapRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: t.bg,
        }}
      />

      {/* No coordinates message overlay */}
      {geoProjects.length === 0 && !loading && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          ...glass({ padding: "32px 28px", textAlign: "center", maxWidth: 400 }),
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>&#9678;</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, marginBottom: 8 }}>
            No Geolocated Projects
          </p>
          <p style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.5 }}>
            Projects need latitude and longitude coordinates to appear on the map.
            Set coordinates in project settings to enable geographic tracking.
          </p>
          {projects.length > 0 && (
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 12 }}>
              {projects.length} project{projects.length !== 1 ? "s" : ""} found without coordinates
            </p>
          )}
        </div>
      )}

      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: "absolute",
          top: 16,
          left: sidebarOpen ? (isMobile ? 280 : 320) : 16,
          zIndex: 20,
          width: 36,
          height: 36,
          borderRadius: 10,
          background: t.bgElevated,
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: `0.5px solid ${t.glassBorder}`,
          color: t.textPrimary,
          fontSize: 16,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: t.glassShadow,
          transition: "left 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
          fontFamily: "inherit",
        }}
      >
        {sidebarOpen ? "\u2039" : "\u203A"}
      </button>

      {/* Sidebar project list */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: isMobile ? 280 : 320,
        zIndex: 15,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
        background: t.bgSidebar,
        backdropFilter: "blur(80px) saturate(180%)",
        WebkitBackdropFilter: "blur(80px) saturate(180%)",
        borderRight: `0.5px solid ${t.divider}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 16px 14px",
          borderBottom: `0.5px solid ${t.divider}`,
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, marginBottom: 4 }}>
            Project Map
          </div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            {geoProjects.length} of {projects.length} project{projects.length !== 1 ? "s" : ""} on map
          </div>
        </div>

        {/* Project list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
          {projects.map((p) => {
            const hasCoords = p.latitude != null && p.longitude != null && p.latitude !== 0 && p.longitude !== 0;
            const isSelected = selectedProject === p.id;
            return (
              <div
                key={p.id}
                onClick={() => {
                  if (hasCoords) {
                    flyToProject(p);
                  } else {
                    setActiveProject(p.id);
                    navigate(`/project/${p.id}/setup`);
                  }
                }}
                style={{
                  padding: "12px 14px",
                  marginBottom: 4,
                  borderRadius: 12,
                  cursor: "pointer",
                  background: isSelected ? t.sidebarActive : "transparent",
                  border: `0.5px solid ${isSelected ? t.accent + "30" : "transparent"}`,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = t.bgCardHover;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>{p.name}</span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 500,
                    padding: "2px 6px",
                    borderRadius: 4,
                    color: statusColor(p.status),
                    background: p.status === "active" ? t.accentDim :
                      p.status === "completed" ? t.neonGreenDim :
                      p.status === "on_hold" ? t.neonAmberDim : t.bgCard,
                  }}>
                    {p.status.replace("_", " ")}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: t.textSecondary }}>{formatCurrency(p.budget)}</span>
                  {hasCoords ? (
                    <span style={{ color: t.textMuted, fontSize: 11 }}>
                      {(p as ProjectWithCoords).latitude!.toFixed(2)}, {(p as ProjectWithCoords).longitude!.toFixed(2)}
                    </span>
                  ) : (
                    <span style={{ color: t.neonAmber, fontSize: 11 }}>No coords</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 16px",
          borderTop: `0.5px solid ${t.divider}`,
          fontSize: 11,
          color: t.textMuted,
        }}>
          Click a marker to view project details
        </div>
      </div>
    </div>
  );
}
