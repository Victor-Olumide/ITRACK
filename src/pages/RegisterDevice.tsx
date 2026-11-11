import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Search, Upload, Box } from "lucide-react";
import { deviceModels as existingModels } from "../lib/mockData";

export default function RegisterDevicePage({ basePath = '/devices' }) {
  const navigate = useNavigate();
  const [modelTab, setModelTab] = useState("existing"); // 'existing' | 'upload'
  const [selectedModel, setSelectedModel] = useState(existingModels[0].name);
  
  const [form, setForm] = useState({
    deviceType: "Laptop",
    make: "Dell",
    model: "Latitude 5440",
    serialNumber: "",
    purchaseDate: "2026-11-02",
    warrantyEnds: "2029-11-02",
    location: "IT store room",
    assignTo: ""
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <main className="min-h-screen bg-[#0B184C] sm:p-6 font-sans text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* BREADCRUMB & HEADER */}
        <div>
          <div className="mb-2 flex items-center text-sm font-medium text-slate-400">
            <ChevronLeft size={16} className="mr-1" />
            <button
              onClick={() => navigate(basePath)}
              className="hover:text-white transition-colors"
            >
              Devices
            </button>
            <span className="mx-2 text-slate-600">/</span>
            <span className="text-white">Register a device</span>
          </div>
        </div>

        {/* MAIN TWO-COLUMN LAYOUT */}

        <div className="p-4 bg-gray-100 rounded-3xl gap-4 flex flex-col">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pt-4">
            <div className="text-black">
              <h1 className="text-3xl font-bold tracking-tight mb-1">Register a device</h1>
              <p className="text-sm text-slate-400">
                Fill in the details, pick a 3D model, then save to generate the asset tag sticker.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => navigate(basePath)}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button className="rounded-full bg-[#3155ff] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600">
                Save and print tag
              </button>
            </div>
          </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {/* LEFT COLUMN: DEVICE DETAILS FORM */}
          <section className="rounded-[28px] bg-white p-7 sm:p-8">
            <h2 className="mb-6 text-xl font-bold text-[#111a38]">Device details</h2>
            
            <div className="space-y-5">
              {/* Type and Tag[cite: 4] */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Device type</span>
                  <select 
                    name="deviceType"
                    value={form.deviceType}
                    onChange={handleInputChange}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option>Laptop</option>
                    <option>Desktop</option>
                    <option>Monitor</option>
                    <option>Mobile</option>
                  </select>
                </label>

                <div>
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Asset tag</span>
                  <div className="flex items-center gap-3 h-[46px]">
                    <span className="flex h-full items-center justify-center rounded-xl bg-[#DCF230] px-4 font-mono text-sm font-bold text-[#445b0f]">
                      IT-LAP-0064
                    </span>
                    <span className="text-xs font-medium text-slate-400">Made for you</span>
                  </div>
                </div>
              </div>

              {/* Make and Model[cite: 4] */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Make</span>
                  <input 
                    name="make"
                    value={form.make}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Model</span>
                  <input 
                    name="model"
                    value={form.model}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              {/* Serial Number[cite: 4] */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Serial number</span>
                <input 
                  name="serialNumber"
                  value={form.serialNumber}
                  onChange={handleInputChange}
                  placeholder="Printed under the device or on the box"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              {/* Dates[cite: 4] */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Purchase date</span>
                  <input 
                    type="date"
                    name="purchaseDate"
                    value={form.purchaseDate}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Warranty ends</span>
                  <input 
                    type="date"
                    name="warrantyEnds"
                    value={form.warrantyEnds}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              {/* Location and Assignment[cite: 4] */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Location</span>
                  <select 
                    name="location"
                    value={form.location}
                    onChange={handleInputChange}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option>IT store room</option>
                    <option>HQ 2nd Floor</option>
                    <option>Security Gate A</option>
                  </select>
                </label>
                <label className="block relative">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Assign to <span className="font-normal text-slate-400">optional</span>
                  </span>
                  <div className="relative">
                    <input 
                      name="assignTo"
                      value={form.assignTo}
                      onChange={handleInputChange}
                      placeholder="Search staff"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-4 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </label>
              </div>

              {/* Info Text[cite: 4] */}
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-500">
                  Leave "Assign to" empty and the device goes in as <strong className="text-slate-800">In store</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: 3D MODEL SELECTION[cite: 4] */}
          <section className="flex flex-col h-full rounded-[28px] bg-[#f8f9fc] p-7 sm:p-8">
            
            {/* Header & Tabs[cite: 4] */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-[#111a38]">3D model</h2>
              
              <div className="flex rounded-full bg-white p-1 shadow-sm">
                <button 
                  onClick={() => setModelTab("existing")}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                    modelTab === "existing" ? "bg-[#111a38] text-white" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Use an existing model
                </button>
                <button 
                  onClick={() => setModelTab("upload")}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                    modelTab === "upload" ? "bg-[#111a38] text-white" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Upload a .glb
                </button>
              </div>
            </div>

            {/* Live Preview Container[cite: 4] */}
            <div className="relative mb-6 flex min-h-[320px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <span className="absolute left-4 top-4 rounded-full bg-[#111a38] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                Live preview
              </span>
              
              {/* Fallback visual for the 3D model */}
              <div className="flex flex-col items-center text-slate-300">
                 <Box size={80} strokeWidth={1} />
                 <span className="mt-2 text-sm font-medium text-slate-400">{selectedModel}</span>
              </div>
            </div>

            {/* Models Selection Section[cite: 4] */}
            {modelTab === "existing" && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-600">Models already in ITrack</h3>
                
                <div className="mb-6 flex flex-wrap gap-2">
                  {existingModels.map((model) => {
                    const isSelected = selectedModel === model.name;
                    return (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model.name)}
                        className={`flex flex-col items-start justify-center rounded-xl border px-4 py-2.5 text-left transition-all ${
                          isSelected 
                            ? "border-blue-600 bg-[#3155ff] text-white shadow-md shadow-blue-500/20" 
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span className="text-sm font-bold">{model.name}</span>
                        <span className={`text-xs font-medium mt-0.5 ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                          Used by {model.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Progress Bar Widget[cite: 4] */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">
                      Hover preview <span className="font-medium text-slate-400">· 8 of 24 frames shown</span>
                    </span>
                    <span className="text-[#ff6a00]">Making previews...</span>
                  </div>
                  
                  <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-1/3 rounded-full bg-[#ff6a00] transition-all duration-1000 ease-in-out" />
                  </div>
                  
                  <p className="text-xs font-medium text-slate-400">
                    Previews are made automatically after upload.
                  </p>
                </div>
              </div>
            )}
            
            {/* Upload State (Alternative view when toggled) */}
            {modelTab === "upload" && (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer">
                 <Upload size={32} className="mb-4 text-slate-400" />
                 <h3 className="mb-1 text-sm font-bold text-slate-700">Click or drag a file to this area to upload</h3>
                 <p className="text-xs font-medium text-slate-500">Supports .glb and .gltf formats up to 50MB</p>
              </div>
            )}

          </section>
        </div>
      </div>
      </div>
     
    </main>
  );
}