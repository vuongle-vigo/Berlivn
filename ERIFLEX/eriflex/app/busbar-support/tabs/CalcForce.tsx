"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

export default function CalcForce() {
  // State for form inputs
  const [formData, setFormData] = useState({
    W: "",
    T: "",
    B: "",
    Angle: "",
    a: "",
    Icc: "",
    Force: "",
    poles: "",
  });

  // State for API response and error
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResponse(null);
    setError(null);

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/calcExcel", {
        W: parseInt(formData.W),
        T: parseInt(formData.T),
        B: parseInt(formData.B),
        Angle: parseInt(formData.Angle),
        a: parseInt(formData.a),
        Icc: parseInt(formData.Icc),
        Force: parseInt(formData.Force),
        NbrePhase: parseInt(formData.poles), // Map poles to NbrePhase for API
      });
      console.log("API Response:", res.data);
      setResponse(JSON.stringify(res.data));
    } catch (err: any) {
      console.error("API Error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "An error occurred while contacting the server"
      );
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-500">
            Calculation of Force
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Width (mm)", name: "W", type: "number", step: "1" },
                { label: "Thickness (mm)", name: "T", type: "number", step: "1" },
                { label: "Per Phase (Số pha)", name: "B", type: "number", step: "1" },
                { label: "Angle (Góc °)", name: "Angle", type: "number", step: "1" },
                { label: "A (Distance phase-phase  mm)", name: "a", type: "number", step: "1" },
                { label: "Icc (kA)", name: "Icc", type: "number", step: "1" },
                { label: "Force (N)", name: "Force", type: "number", step: "1" },
                { label: "Poles (Số cực)", name: "poles", type: "number", step: "1" },
              ].map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    step={field.step}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    placeholder={`Enter ${field.label}`}
                    required
                  />
                </div>
              ))}
            </div>
            <Button type="submit" className="w-full md:w-auto">
              Calculate
            </Button>
          </form>

          {/* Display response or error */}
          {response && (
            <Alert className="mt-4">
              <AlertDescription>
                <strong>Response:</strong> {response} (mm)
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}