import { ImageResponse } from "next/og";

export const alt = "Prospkt private beta waitlist";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFAFA",
          color: "#0A0A0A",
          fontFamily: "Arial, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 760,
            height: 760,
            border: "1px solid #ECECEA",
            borderRadius: 760,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 1030,
            height: 1030,
            border: "1px solid #ECECEA",
            borderRadius: 1030,
          }}
        />

        <div
          style={{
            width: 960,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 34,
            }}
          >
            <div
              style={{
                width: 74,
                height: 74,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 20,
                background: "#0A0A0A",
                color: "#FFFFFF",
                fontSize: 38,
                fontWeight: 700,
                marginRight: 18,
              }}
            >
              {"\u26A1"}
            </div>
            <div style={{ fontSize: 44, fontWeight: 700 }}>Prospkt</div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #E3E3E1",
              borderRadius: 999,
              background: "#FFFFFF",
              padding: "10px 18px",
              color: "#6B6B6B",
              fontSize: 22,
              fontWeight: 600,
              marginBottom: 26,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 10,
                background: "#2E7D4F",
                marginRight: 10,
              }}
            />
            Private beta waitlist
          </div>

          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: 0,
              maxWidth: 850,
            }}
          >
            An AI sales rep that calls back and books jobs.
          </div>

          <div
            style={{
              marginTop: 28,
              color: "#6B6B6B",
              fontSize: 28,
              lineHeight: 1.35,
              maxWidth: 780,
            }}
          >
            Calls back missed leads, follows up on estimates, and keeps the
            owner in control.
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 44,
            }}
          >
            {["Missed calls", "Estimate follow-up", "Booked jobs"].map(
              (item) => (
                <div
                  key={item}
                  style={{
                    border: "1px solid #E3E3E1",
                    background: "#FFFFFF",
                    borderRadius: 16,
                    padding: "14px 18px",
                    fontSize: 20,
                    fontWeight: 700,
                    marginRight: 12,
                  }}
                >
                  {item}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    ),
    size
  );
}
