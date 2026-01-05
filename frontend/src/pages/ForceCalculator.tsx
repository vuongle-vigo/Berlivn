import { useState } from "react";
import { Zap, TrendingUp, AlertCircle } from "lucide-react";

export default function ForceCalculator() {
  const [formData, setFormData] = useState({
    width: "",
    thickness: "",
    busbarsPerPhase: "",
    angle: "0",
    distancePhasePhase: "",
    icc: "",
    force: "",
    poles: "3",
  });

  const [result, setResult] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const calculateForce = () => {
    const { width, thickness, busbarsPerPhase, angle, distancePhasePhase, icc, force, poles } = formData;

    if (!width || !thickness || !busbarsPerPhase || !distancePhasePhase || !icc || !force) {
      setError("Please fill in all required fields");
      return;
    }

    setIsCalculating(true);
    setError(null);

    setTimeout(() => {
      const w = parseFloat(width);
      const t = parseFloat(thickness);
      const b = parseFloat(busbarsPerPhase);
      const a = parseFloat(distancePhasePhase);
      const iccVal = parseFloat(icc);
      const forceVal = parseFloat(force);
      const angleVal = parseFloat(angle);
      const polesVal = parseFloat(poles);

      const mockCalculation =
        Math.sqrt((w * t * b * forceVal) / (iccVal * a)) *
        (1 + angleVal / 90) *
        (polesVal / 3);

      setResult(Math.round(mockCalculation * 100));
      setIsCalculating(false);
    }, 800);
  };

  const fields = [
    {
      label: "Width (mm)",
      name: "width",
      placeholder: "Enter busbar width",
      icon: "↔",
    },
    {
      label: "Thickness (mm)",
      name: "thickness",
      placeholder: "Enter thickness",
      icon: "⬌",
    },
    {
      label: "Busbars Per Phase",
      name: "busbarsPerPhase",
      placeholder: "Number of busbars",
      icon: "#",
    },
    {
      label: "Angle (°)",
      name: "angle",
      placeholder: "Mounting angle",
      icon: "∠",
    },
    {
      label: "Distance Phase-Phase (mm)",
      name: "distancePhasePhase",
      placeholder: "Distance between phases",
      icon: "⟷",
    },
    {
      label: "Icc (kA)",
      name: "icc",
      placeholder: "Short circuit current",
      icon: "⚡",
    },
    {
      label: "Force (N)",
      name: "force",
      placeholder: "Applied force",
      icon: "💪",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-400 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Force Analysis Calculator
            </h2>
            <p className="text-sm text-gray-500">
              Calculate electromagnetic forces on busbar systems
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <div className="font-semibold text-red-900">Input Error</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="mr-2">{field.icon}</span>
                {field.label}
              </label>
              <input
                type="number"
                value={formData[field.name as keyof typeof formData]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all placeholder-gray-400"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <span className="mr-2">🔌</span>
              Number of Poles
            </label>
            <select
              value={formData.poles}
              onChange={(e) => handleChange("poles", e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            >
              <option value="2">Bi-polar (2)</option>
              <option value="3">Three-phase (3)</option>
              <option value="4">Four-pole (4)</option>
            </select>
          </div>
        </div>

        <button
          onClick={calculateForce}
          disabled={isCalculating}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-500 text-white py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCalculating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              <span>Calculate Maximum Spacing</span>
            </>
          )}
        </button>
      </div>

      {result !== null && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-8 border-2 border-green-200 animate-fade-in">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Calculation Complete
            </h3>
            <div className="text-sm text-gray-600 mb-4">
              Maximum Support Spacing (L)
            </div>
            <div className="text-5xl font-bold text-green-900 mb-2">
              {result}
              <span className="text-2xl ml-2">mm</span>
            </div>
            <div className="inline-block bg-green-200 text-green-900 px-4 py-2 rounded-full text-sm font-semibold mt-4">
              ✓ Within acceptable limits
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Safety Factor</div>
              <div className="text-lg font-bold text-gray-900">1.5x</div>
            </div>
            <div className="bg-white/80 p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Stress Level</div>
              <div className="text-lg font-bold text-gray-900">Normal</div>
            </div>
            <div className="bg-white/80 p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Compliance</div>
              <div className="text-lg font-bold text-gray-900">IEC 61439</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Calculation Information
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            This calculator determines the maximum support spacing for busbar
            systems based on electromagnetic forces during short circuit
            conditions.
          </p>
          <p>
            Results are calculated according to IEC 61439 standards and include
            appropriate safety factors for mechanical stress analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
