"use client";

import { useState } from "react";
import {
  getComponent,
  updateComponentData,
  uploadProductImages,
  uploadProductFiles,
  deleteComponent as deleteComponentApi,
  createComponent as createComponentApi,
  deleteImageByPath,
  deleteFileByPath,
  getImageBlobByPath,
  getFileBlobByPath,
} from "@/api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Products() {
  // State for search inputs
  const [componentId, setComponentId] = useState("");
  const [searchNbphase, setSearchNbphase] = useState("");
  const [shouldSearch, setShouldSearch] = useState(false);

  // State for component data (existing form)
  const [componentData, setComponentData] = useState({
    key: "",
    nbphase: "",
    angle: "",
    resmini: "",
    info: "",
    a_list: "",
    thickness: "",
    width: "",
    poles: "",
    shape: "",
  });

  // State for images
  const [images, setImages] = useState({
    img1: { url: null, extension: "jpg" },
    img2: { url: null, extension: "jpg" },
    img3: { url: null, extension: "jpg" },
  });
  const [imageFiles, setImageFiles] = useState({
    img1: null,
    img2: null,
    img3: null,
  });

  // State for documents
  const [documents, setDocuments] = useState({
    doc: { url: null, name: null, extension: null },
    "2d": { url: null, name: null, extension: null },
    "3d": { url: null, name: null, extension: null },
  });
  const [documentUploads, setDocumentUploads] = useState({
    doc: null,
    "2d": null,
    "3d": null,
  });

  // State for create form (dialog)
  const [createData, setCreateData] = useState({
    component_id: "",
    nbphase: "",
    angle: "",
    resmini: "",
    info: "",
    a_list: "",
    thickness: "",
    width: "",
    poles: "",
    shape: "",
  });

  // State for API response and error
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  // State for dialog
  const [open, setOpen] = useState(false);

  // Allowed image and document formats
  const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxImageSize = 5 * 1024 * 1024; // 5MB
  const allowedDocTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const allowed3DTypes = ["application/step", "model/step"];
  const maxDocSize = 10 * 1024 * 1024; // 10MB

  // Handle search input changes
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    if (name === "componentId") {
      setComponentId(value);
    } else if (name === "searchNbphase") {
      setSearchNbphase(value);
    }
  };

  // Handle component data input change (existing form)
  const handleDataChange = (e) => {
    setComponentData({ ...componentData, [e.target.name]: e.target.value });
  };

  // Handle create form input change (dialog)
  const handleCreateDataChange = (e) => {
    setCreateData({ ...createData, [e.target.name]: e.target.value });
  };

  // Handle image file selection
  const handleImageChange = (e, imgKey) => {
    const file = e.target.files[0];
    if (file) {
      if (!allowedImageTypes.includes(file.type)) {
        setError(`Vui lòng chọn file ảnh định dạng JPEG, PNG hoặc WEBP cho ảnh ${imgKey.slice(-1)}`);
        return;
      }
      if (file.size > maxImageSize) {
        setError(`Kích thước file ảnh ${imgKey.slice(-1)} không được vượt quá 5MB`);
        return;
      }
      setImageFiles({ ...imageFiles, [imgKey]: file });
      const extension = file.name.split(".").pop().toLowerCase();
      setImages({
        ...images,
        [imgKey]: { url: URL.createObjectURL(file), extension },
      });
    }
  };

  // Handle image deletion
  const handleImageDelete = async (imgKey) => {
    if (!componentData.key || !componentData.resmini) return;
    const imgNumber = imgKey.slice(-1);
    const extension = images[imgKey].extension || "jpg";
    const imagePath = `/products/${componentData.key}-${componentData.resmini}-${componentData.nbphase}-${imgNumber}.${extension}`;

    try {
      const res = await deleteImageByPath(imagePath);
      if (!res.ok) {
        setError(res.data?.detail || `Lỗi khi xóa ảnh ${imgNumber}`);
        return;
      }
      setImages({
        ...images,
        [imgKey]: { url: null, extension: "jpg" },
      });
      setImageFiles({ ...imageFiles, [imgKey]: null });
      setResponse(res.data?.message || `Xóa ảnh ${imgNumber} thành công`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi xóa ảnh");
    }
  };

  // Handle document file selection
  const handleDocumentChange = (e, docKey) => {
    const file = e.target.files[0];
    if (file) {
      console.log(`Selected file for ${docKey}:`, {
        name: file.name,
        type: file.type,
        size: file.size,
      }); // Debug logging
      const extension = file.name.split(".").pop().toLowerCase();

      // Validate file type for doc and 2d only
      let isValidType = true;
      if (docKey !== "3d") {
        isValidType = allowedDocTypes.includes(file.type);
        if (!isValidType) {
          setError(`Vui lòng chọn file PDF hoặc DOC/DOCX cho ${docKey.toUpperCase()}`);
          console.log(`Invalid file type for ${docKey}: ${file.type}, extension: ${extension}`);
          return;
        }
      }

      // Validate file size for all files
      if (file.size > maxDocSize) {
        setError(`Kích thước file ${docKey.toUpperCase()} không được vượt quá 10MB`);
        console.log(`File too large for ${docKey}: ${file.size} bytes`);
        return;
      }

      setDocumentUploads({ ...documentUploads, [docKey]: file });
      setDocuments({
        ...documents,
        [docKey]: { url: URL.createObjectURL(file), name: file.name, extension },
      });
      console.log(`Updated documents state for ${docKey}:`, documents[docKey]);
    }
  };

  // Handle document file deletion
  const handleDocumentDelete = async (docKey) => {
    if (!componentData.key || !componentData.resmini) return;
    const suffix = docKey === "doc" ? "doc" : docKey === "2d" ? "2d" : "3d";
    const extension = documents[docKey].extension || (docKey === "3d" ? "stp" : "pdf");
    const filePath = `/documents/${componentData.key}-${componentData.resmini}-${componentData.nbphase}-${suffix}.${extension}`;

    try {
      const res = await deleteFileByPath(filePath);
      if (!res.ok) {
        setError(res.data?.detail || `Lỗi khi xóa tài liệu ${docKey.toUpperCase()}`);
        return;
      }
      setDocuments({
        ...documents,
        [docKey]: { url: null, name: null, extension: null },
      });
      setDocumentUploads({ ...documentUploads, [docKey]: null });
      setResponse(res.data?.message || `Xóa tài liệu ${docKey.toUpperCase()} thành công`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi xóa tài liệu");
    }
  };

  // Normalize input to array
  const normalizeToArray = (value, isNumeric = false) => {
    if (Array.isArray(value)) {
      return isNumeric ? value.map((val) => parseFloat(val)).filter((val) => !isNaN(val)) : value;
    }
    if (typeof value === "string") {
      const result = value.split(/[\s,]+/).filter((val) => val.trim() !== "");
      return isNumeric ? result.map((val) => parseFloat(val)).filter((val) => !isNaN(val)) : result;
    }
    if (typeof value === "number") {
      return [value];
    }
    return [];
  };

  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!componentId.trim()) {
      setError("Component ID không được để trống");
      return;
    }
    if (!shouldSearch) return;

    const nbphaseValue = parseInt(searchNbphase);
    if (isNaN(nbphaseValue)) {
      setError("Vui lòng nhập Số pha hợp lệ");
      setShouldSearch(false);
      return;
    }

    setResponse(null);
    setError(null);
    setComponentData({
      key: "",
      nbphase: "",
      angle: "",
      resmini: "",
      info: "",
      a_list: "",
      thickness: "",
      width: "",
      poles: "",
      shape: "",
    });
    setImages({
      img1: { url: null, extension: "jpg" },
      img2: { url: null, extension: "jpg" },
      img3: { url: null, extension: "jpg" },
    });
    setImageFiles({ img1: null, img2: null, img3: null });
    setDocuments({
      doc: { url: null, name: null, extension: null },
      "2d": { url: null, name: null, extension: null },
      "3d": { url: null, name: null, extension: null },
    });
    setDocumentUploads({ doc: null, "2d": null, "3d": null });

    try {
      const res = await getComponent(componentId.trim(), nbphaseValue);
      if (!res.ok || !res.data?.components || !res.data?.components_list) {
        setError(res.data?.detail || "Không tìm thấy component với ID và Number of Phases đã nhập");
        return;
      }

      const data = {
        key: res.data.components.key || "",
        nbphase: res.data.components.nbphase?.toString() || "",
        angle: res.data.components.angle?.toString() || "",
        resmini: (res.data.components.resmini * 10)?.toString() || "",
        info: res.data.components.info || "",
        a_list: res.data.components.a_list || "",
        thickness: res.data.components_list.thickness || "",
        width: res.data.components_list.width || "",
        poles: res.data.components_list.poles || "",
        shape: res.data.components_list.shape || "",
      };
      setComponentData(data);

      const imageBase = `/products/${data.key}-${data.resmini}-${data.nbphase}`;
      const extensions = ["jpg", "png", "webp"];
      const imagePromises = [1, 2, 3].map(async (i) => {
        for (const ext of extensions) {
          const path = `${imageBase}-${i}.${ext}`;
          const imgRes = await getImageBlobByPath(path);
          if (imgRes.ok && imgRes.blob) {
            return { imgKey: `img${i}`, url: URL.createObjectURL(imgRes.blob), extension: ext };
          }
        }
        return { imgKey: `img${i}`, url: null, extension: "jpg" };
      });
      const imageResults = await Promise.all(imagePromises);
      const newImages = {
        img1: { url: null, extension: "jpg" },
        img2: { url: null, extension: "jpg" },
        img3: { url: null, extension: "jpg" },
      };
      imageResults.forEach(({ imgKey, url, extension }) => {
        newImages[imgKey] = { url, extension };
      });
      setImages(newImages);

      const docBase = `/documents/${data.key}-${data.resmini}-${data.nbphase}`;
      const docKeys = ["doc", "2d", "3d"] as const;
      const docPromises = docKeys.map(async (key) => {
        const suffix = key === "doc" ? "doc" : key === "2d" ? "2d" : "3d";
        const docExtensions = key === "3d" ? ["stp", "step"] : ["pdf", "doc", "docx"];
        for (const ext of docExtensions) {
          const path = `${docBase}-${suffix}.${ext}`;
          const fileRes = await getFileBlobByPath(path);
          if (fileRes.ok && fileRes.blob) {
            return {
              docKey: key,
              url: URL.createObjectURL(fileRes.blob),
              name: `${data.key}-${data.resmini}-${data.nbphase}-${suffix}.${ext}`,
              extension: ext,
            };
          }
        }
        return { docKey: key, url: null, name: null, extension: null };
      });
      const docResults = await Promise.all(docPromises);
      const newDocuments = {
        doc: { url: null, name: null, extension: null },
        "2d": { url: null, name: null, extension: null },
        "3d": { url: null, name: null, extension: null },
      };
      docResults.forEach(({ docKey, url, name, extension }) => {
        newDocuments[docKey] = { url, name, extension };
      });
      setDocuments(newDocuments);

      setResponse("Tải dữ liệu component, ảnh và tài liệu thành công");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi kết nối với server");
    }
    setShouldSearch(false);
  };

  // Handle save submission (including images and documents)
  const handleSave = async (e) => {
    e.preventDefault();
    setResponse(null);
    setError(null);

    if (!componentData.key.trim()) {
      setError("Component ID không được để trống");
      return;
    }
    const angleValue = parseInt(componentData.angle);
    if (isNaN(angleValue)) {
      setError("Vui lòng nhập Angle hợp lệ");
      return;
    }
    const resminiValue = parseInt(componentData.resmini);
    if (isNaN(resminiValue)) {
      setError("Vui lòng nhập Resmini hợp lệ");
      return;
    }
    const nbphaseValue = parseInt(componentData.nbphase);
    if (isNaN(nbphaseValue)) {
      setError("Vui lòng nhập Number of Phases hợp lệ");
      return;
    }
    if (!componentData.info.trim()) {
      setError("Info không được để trống");
      return;
    }
    if (!componentData.a_list.trim()) {
      setError("A List không được để trống");
      return;
    }

    const payload = {
      key: componentData.key,
      nbphase: nbphaseValue,
      angle: angleValue,
      resmini: resminiValue / 10,
      info: componentData.info,
      a_list: componentData.a_list,
      thickness: normalizeToArray(componentData.thickness, true),
      width: normalizeToArray(componentData.width, true),
      poles: normalizeToArray(componentData.poles, true),
      shape: normalizeToArray(componentData.shape, false),
    };

    try {
      const updateRes = await updateComponentData(payload);
      if (!updateRes.ok) {
        setError(updateRes.data?.detail || "Đã xảy ra lỗi khi cập nhật component");
        return;
      }

      const imageFormData = new FormData();
      let hasImages = false;
      Object.entries(imageFiles).forEach(([key, file]) => {
        if (file) {
          hasImages = true;
          const imgNumber = key.slice(-1);
          const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
          imageFormData.append(
            `img${imgNumber}`,
            file,
            `${componentData.key}-${resminiValue}-${nbphaseValue}-${imgNumber}.${extension}`
          );
        }
      });
      if (hasImages) {
        const uploadImagesRes = await uploadProductImages(imageFormData);
        if (!uploadImagesRes.ok) {
          setError(uploadImagesRes.data?.detail || "Đã xảy ra lỗi khi tải ảnh lên");
          return;
        }
      }

      const docFormData = new FormData();
      let hasDocs = false;
      Object.entries(documentUploads).forEach(([key, file]) => {
        if (file) {
          hasDocs = true;
          const suffix = key === "doc" ? "doc" : key === "2d" ? "2d" : "3d";
          const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
          const formKey = key === "doc" ? "doc" : key === "2d" ? "two_d" : "three_d";
          docFormData.append(
            formKey,
            file,
            `${componentData.key}-${resminiValue}-${nbphaseValue}-${suffix}.${extension}`
          );
        }
      });
      if (hasDocs) {
        const uploadDocsRes = await uploadProductFiles(docFormData);
        if (!uploadDocsRes.ok) {
          setError(uploadDocsRes.data?.detail || "Đã xảy ra lỗi khi tải tài liệu lên");
          return;
        }
      }

      setResponse(updateRes.data?.message || "Cập nhật component, ảnh và tài liệu thành công");
      setImageFiles({ img1: null, img2: null, img3: null });
      setDocumentUploads({ doc: null, "2d": null, "3d": null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi kết nối với server");
    }
  };

  // Handle delete submission
  const handleDelete = async () => {
    setResponse(null);
    setError(null);

    if (!componentData.key.trim()) {
      setError("Component ID không được để trống");
      return;
    }
    const nbphaseValue = parseInt(componentData.nbphase);
    if (isNaN(nbphaseValue)) {
      setError("Number of Phases không hợp lệ");
      return;
    }

    const payload = { component_id: componentData.key, nbphase: nbphaseValue };
    try {
      const res = await deleteComponentApi(payload);
      if (!res.ok) {
        setError(res.data?.detail || "Đã xảy ra lỗi khi xóa component");
        return;
      }
      setResponse(res.data?.message || "Xóa component thành công");
      setComponentData({
        key: "",
        nbphase: "",
        angle: "",
        resmini: "",
        info: "",
        a_list: "",
        thickness: "",
        width: "",
        poles: "",
        shape: "",
      });
      setImages({
        img1: { url: null, extension: "jpg" },
        img2: { url: null, extension: "jpg" },
        img3: { url: null, extension: "jpg" },
      });
      setImageFiles({ img1: null, img2: null, img3: null });
      setDocuments({
        doc: { url: null, name: null, extension: null },
        "2d": { url: null, name: null, extension: null },
        "3d": { url: null, name: null, extension: null },
      });
      setDocumentUploads({ doc: null, "2d": null, "3d": null });
      setComponentId("");
      setSearchNbphase("");
      setShouldSearch(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi kết nối với server");
    }
  };

  // Handle create submission
  const handleCreate = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setResponse(null);
    setError(null);

    if (!createData.component_id.trim()) {
      setError("Component ID không được để trống");
      return;
    }
    const nbphaseValue = parseInt(createData.nbphase);
    if (isNaN(nbphaseValue)) {
      setError("Vui lòng nhập Number of Phases hợp lệ");
      return;
    }
    const angleValue = parseInt(createData.angle);
    if (isNaN(angleValue)) {
      setError("Vui lòng nhập Angle hợp lệ");
      return;
    }
    const resminiValue = parseInt(parseFloat(createData.resmini) / 10);
    if (isNaN(resminiValue)) {
      setError("Vui lòng nhập Resmini hợp lệ");
      return;
    }
    if (!createData.info.trim()) {
      setError("Info không được để trống");
      return;
    }
    if (!createData.a_list.trim()) {
      setError("A List không được để trống");
      return;
    }

    const payload = {
      key: createData.component_id,
      nbphase: nbphaseValue,
      angle: angleValue,
      resmini: resminiValue,
      info: createData.info,
      a_list: createData.a_list,
      thickness: normalizeToArray(createData.thickness, true),
      width: normalizeToArray(createData.width, true),
      poles: normalizeToArray(createData.poles, true),
      shape: normalizeToArray(createData.shape, false),
    };

    try {
      const res = await createComponentApi(payload);
      if (!res.ok) {
        setError(res.data?.detail || "Đã xảy ra lỗi khi thêm component");
        return;
      }
      setResponse(res.data?.message || "Thêm component thành công");
      setCreateData({
        component_id: "",
        nbphase: "",
        angle: "",
        resmini: "",
        info: "",
        a_list: "",
        thickness: "",
        width: "",
        poles: "",
        shape: "",
      });
      setOpen(false);
      setComponentId("");
      setSearchNbphase("");
      setShouldSearch(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi kết nối với server");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-500">Products</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search Form */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <form
              onSubmit={(e) => {
                setShouldSearch(true);
                handleSearch(e);
              }}
              className="space-y-4 flex-1"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="componentId">Component ID (Mã sản phẩm)</Label>
                  <Input
                    id="componentId"
                    name="componentId"
                    value={componentId}
                    onChange={handleSearchChange}
                    placeholder="Nhập mã sản phẩm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="searchNbphase">Per phases (Số pha)</Label>
                  <Input
                    id="searchNbphase"
                    name="searchNbphase"
                    type="number"
                    step="1"
                    min="0"
                    value={searchNbphase}
                    onChange={handleSearchChange}
                    placeholder="Nhập Số pha"
                    required
                  />
                </div>
              </div>
              <div className="flex">
                <Button type="submit" className="w-full md:w-auto">
                  Tìm kiếm
                </Button>
              </div>
            </form>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto self-start">Thêm mới</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[720px] md:max-w-[760px] p-6 space-y-4">
                <DialogHeader>
                  <DialogTitle>Thêm Component Mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Component ID (Mã sản phẩm)", name: "component_id", type: "text" },
                      { label: "Per phases (Số pha)", name: "nbphase", type: "number", step: "1" },
                      { label: "Angle (Góc °)", name: "angle", type: "number", step: "1" },
                      { label: "Force (N)", name: "resmini", type: "number", step: "1" },
                      { label: "Thickness (mm)", name: "thickness", type: "text" },
                      { label: "Width (mm)", name: "width", type: "text" },
                      { label: "Poles (Số cực)", name: "poles", type: "text" },
                      { label: "Shape (C, P, I, E)", name: "shape", type: "text" },
                    ].map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>{field.label}</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type={field.type}
                          step={field.step}
                          min={field.type === "number" ? "0" : undefined}
                          value={createData[field.name]}
                          onChange={handleCreateDataChange}
                          placeholder={`Nhập ${field.label}`}
                          required
                        />
                      </div>
                    ))}
                    <div className="space-y-2">
                      <Label htmlFor="info">Thông tin sản phẩm</Label>
                      <Textarea
                        id="info"
                        name="info"
                        value={createData.info}
                        onChange={handleCreateDataChange}
                        placeholder="Nhập thông tin (ví dụ: mô tả, tính năng)"
                        required
                        minLength={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="a_list">Danh sách giá trị A</Label>
                      <Textarea
                        id="a_list"
                        name="a_list"
                        value={createData.a_list}
                        onChange={handleCreateDataChange}
                        placeholder="Nhập danh sách giá trị A (ví dụ: 65, 75, 85)"
                        required
                        minLength={1}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Hủy
                    </Button>
                    <Button type="submit">Thêm</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Component Data Form */}
          {componentData.key && (
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Component ID (Mã sản phẩm)", name: "key", type: "text", readOnly: true },
                  { label: "Angle (Góc °)", name: "angle", type: "number", step: "1" },
                  { label: "Force (N)", name: "resmini", type: "number", step: "1" },
                  { label: "Thickness (mm)", name: "thickness", type: "text" },
                  { label: "Width (mm)", name: "width", type: "text" },
                  { label: "Poles (Số cực)", name: "poles", type: "text" },
                  { label: "Shape (C, P, I, E)", name: "shape", type: "text" },
                ].map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      step={field.step}
                      min={field.type === "number" ? "0" : undefined}
                      value={componentData[field.name]}
                      onChange={handleDataChange}
                      placeholder={`Nhập ${field.label}`}
                      readOnly={field.readOnly}
                      required={!field.readOnly}
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  <Label htmlFor="info">Thông tin sản phẩm</Label>
                  <Textarea
                    id="info"
                    name="info"
                    value={componentData.info}
                    onChange={handleDataChange}
                    placeholder="Nhập thông tin (ví dụ: mô tả, tính năng)"
                    required
                    minLength={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a_list">Danh sách giá trị A</Label>
                  <Textarea
                    id="a_list"
                    name="a_list"
                    value={componentData.a_list}
                    onChange={handleDataChange}
                    placeholder="Nhập danh sách giá trị A (ví dụ: 65, 75, 85)"
                    required
                    minLength={1}
                  />
                </div>
              </div>

              {/* Image Management Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Quản lý ảnh sản phẩm</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["img1", "img2", "img3"].map((imgKey) => (
                    <div key={imgKey} className="space-y-2">
                      <Label>Ảnh {imgKey.slice(-1)} ({images[imgKey].extension.toUpperCase()})</Label>
                      <div className="border p-2 rounded">
                        {images[imgKey].url ? (
                          <div className="space-y-2">
                            <img
                              src={images[imgKey].url}
                              alt={`Ảnh ${imgKey.slice(-1)}`}
                              className="w-full h-32 object-cover rounded"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleImageDelete(imgKey)}
                              className="w-full"
                            >
                              Xóa ảnh
                            </Button>
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded">
                            <span>Chưa có ảnh</span>
                          </div>
                        )}
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => handleImageChange(e, imgKey)}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Management Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Quản lý tài liệu sản phẩm</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["doc", "2d", "3d"].map((docKey) => (
                    <div key={docKey} className="space-y-2">
                      <Label>Tài liệu {docKey.toUpperCase()} {documents[docKey].extension ? `(${documents[docKey].extension.toUpperCase()})` : ''}</Label>
                      <div className="border p-2 rounded">
                        {documents[docKey].url ? (
                          <div className="space-y-2">
                            <a
                              href={documents[docKey].url}
                              download={documents[docKey].name}
                              className="text-blue-600 hover:underline block truncate"
                            >
                              {documents[docKey].name}
                            </a>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDocumentDelete(docKey)}
                              className="w-full"
                            >
                              Xóa tài liệu
                            </Button>
                          </div>
                        ) : (
                          <div className="w-full h-16 bg-gray-100 flex items-center justify-center rounded">
                            <span>Chưa có tài liệu</span>
                          </div>
                        )}
                        <Input
                          type="file"
                          accept={docKey === '3d' ? '*' : '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
                          onChange={(e) => {
                            console.log(`File input changed for ${docKey}:`, e.target.files[0]);
                            handleDocumentChange(e, docKey);
                          }}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" className="w-full md:w-auto">Lưu thay đổi</Button>
                <Button type="button" variant="destructive" className="w-full md:w-auto" onClick={handleDelete}>
                  Xóa
                </Button>
              </div>
            </form>
          )}

          {/* Display response or error */}
          {response && (
            <Alert className="mt-4">
              <AlertDescription><strong>Phản hồi:</strong> {response}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription><strong>Lỗi:</strong> {error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}