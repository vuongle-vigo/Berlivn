"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BusbarSupport from "@/app/busbar-support/tabs/BusbarSupport";
import OtherTag from "@/app/busbar-support/tabs/OtherTag";
import CalcForce from "@/app/busbar-support/tabs/CalcForce";
import Products from "@/app/busbar-support/tabs/Products";

export default function BusbarSupportPage() {
  const [activeTab, setActiveTab] = useState("Busbar Support");

  return (
    <div className="min-h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-destructive">BERLIVN</h1>
        <div className="flex items-center gap-4">
          <span className="text-foreground font-medium">User: LE DINH DUONG</span>
          <Button
            variant="destructive"
            onClick={() => alert("Logout functionality not implemented yet.")}
          >
            Logout
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="Busbar Support">Busbar Support</TabsTrigger>
          <TabsTrigger value="Products">Products</TabsTrigger>
          <TabsTrigger value="Calc Force">Calc Force</TabsTrigger>
          <TabsTrigger value="Other Tag">Other Tag</TabsTrigger>
        </TabsList>
        <TabsContent value="Busbar Support">
          <BusbarSupport />
        </TabsContent>
        <TabsContent value="Products">
          <Products />
        </TabsContent>
        <TabsContent value="Calc Force">
          <CalcForce />
        </TabsContent>
        <TabsContent value="Other Tag">
          <OtherTag />
        </TabsContent>
      </Tabs>
    </div>
  );
}