import { useState, useEffect } from "react";

interface BusProps {
  leftValue: string;
  centerValue: string;
}

export default function BusbarCanvas({ leftValue: initialLeftValue, centerValue: initialCenterValue }: BusProps) {
  const [leftValue, setLeftValue] = useState(initialLeftValue || "146");
  const [centerValue, setCenterValue] = useState(initialCenterValue || "582");

  useEffect(() => {
    setLeftValue(initialLeftValue || "146");
    setCenterValue(initialCenterValue || "582");
  }, [initialLeftValue, initialCenterValue]);

  return (
    <svg width="800" height="150">
      <path
        d="M50,30 H740 L720,60 Q710,55 700,60 H50 V30 Z"
        fill="orange"
        stroke="black"
        strokeWidth="2"
      />

      <rect x="190" y="20" width="10" height="40" fill="brown" />
      <rect x="610" y="20" width="10" height="40" fill="brown" />

      <line
        x1="50" y1="80"
        x2="190" y2="80"
        stroke="black"
        markerStart="url(#slash)"
        markerEnd="url(#slash)"
      />
      <line
        x1="190" y1="80"
        x2="610" y2="80"
        stroke="black"
        markerStart="url(#slash)"
        markerEnd="url(#slash)"
      />

      <foreignObject x="90" y="60" width="60" height="30">
        <input
          type="text"
          value={leftValue}
          onChange={(e) => setLeftValue(e.target.value)}
          style={{ width: "50px", fontSize: "14px", textAlign: "center" }}
        />
      </foreignObject>

      <foreignObject x="360" y="60" width="60" height="30">
        <input
          type="text"
          value={centerValue}
          onChange={(e) => setCenterValue(e.target.value)}
          style={{ width: "50px", fontSize: "14px", textAlign: "center" }}
        />
      </foreignObject>

      <text x="320" y="120" fontSize="14">Maximum support spacing L (mm)</text>

      <defs>
        <marker id="slash" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto" markerUnits="strokeWidth">
          <path d="M2,8 L8,2" stroke="#000" strokeWidth="2" />
        </marker>
      </defs>
    </svg>
  );
}
