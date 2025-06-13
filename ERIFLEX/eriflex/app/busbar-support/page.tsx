"use client";

import { useState } from "react";
import BusbarSupport from "@/app/busbar-support/tabs/BusbarSupport";
import OtherTag from "@/app/busbar-support/tabs/OtherTag";
import CalcForce from "@/app/busbar-support/tabs/CalcForce";
import Products from "@/app/busbar-support/tabs/Products";
export default function BusbarSupportPage() {
  const [activeTab, setActiveTab] = useState("Busbar Support");

  return (
    <div className="min-h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-red-500">BERLIVN</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium">User: LE DINH DUONG</span>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={() => alert("Logout functionality not implemented yet.")}
          >
            Logout
          </button>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b">
        <button
          className={`px-4 py-2 ${
            activeTab === "Busbar Support" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("Busbar Support")}
        >
          Busbar Support
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "Products" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("Products")}
        >
          Products
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "Calc Force" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("Calc Force")}
        >
          Calc Force
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "Other Tag" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("Other Tag")}
        >
          Other Tag
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "Busbar Support" && <BusbarSupport />}
        {activeTab === "Products" && <Products />}
        {activeTab === "Calc Force" && <CalcForce />}
        {activeTab === "Other Tag" && <OtherTag />}
      </div>
    </div>
  );
}