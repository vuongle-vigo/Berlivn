"use client";

import axios from "axios";
import { useState } from "react";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Bus from "./BusbarCanvas";

export default function BusbarSupport() {
  const [perPhase, setPerPhase] = useState("1 Busbar");
  const [thickness, setThickness] = useState("2");
  const [widthOptions, setWidthOptions] = useState(["12"]);
  const [width, setWidth] = useState("12");
  const [poles, setPoles] = useState("Four"); // Default to "Four"
  const [shape, setShape] = useState("C");
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [image1, setImage1] = useState("/unknown.jpg");
  const [image2, setImage2] = useState("/unknown.jpg");
  const [image3, setImage3] = useState("/unknown.jpg");
  const [icc, setIcc] = useState(12);
  const [ipk, setIpk] = useState(0);
  const [spaceBetweenPhases, setSpaceBetweenPhases] = useState(0);
  const [distanceBetweenFixingPoints, setDistanceBetweenFixingPoints] =
    useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnlyWithImg1, setShowOnlyWithImg1] = useState(false); // State for filtering
  const itemsPerPage = 10;
  const [quantities, setQuantities] = useState({});
  const [prices, setPrices] = useState({});

  const handleQuantityChange = (id, value) => {
    setQuantities((prev) => ({ ...prev, [id]: value }));
  };

  const handlePriceChange = (id, value) => {
    setPrices((prev) => ({ ...prev, [id]: value }));
  };

  const calculateTotal = (id) => {
    const quantity = Number(quantities[id] || 0);
    const price = Number(prices[id] || 0);
    return (quantity * price).toFixed(2);
  };

  // Filter products based on showOnlyWithImg1
  const filteredProducts = showOnlyWithImg1
    ? products.filter((product) => !product.additionalInfo?.[0]?.img1Article)
    : products;

  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const [inputValue, setInputValue] = useState("12");
  const handleIccChange = (value: string) => {
    // Clean input: remove leading zeros and non-numeric characters (allow decimal)
    const cleanedValue = value.replace(/^0+/, "").replace(/[^\d.]/g, "") || "0";
    setInputValue(cleanedValue);

    // Convert to number for icc state
    const numericValue = Math.min(Math.max(Number(cleanedValue), 12), 200);
    setIcc(numericValue || 0);
  };

  const handleBlur = () => {
    // Ensure input displays the numeric value without leading zeros
    setInputValue((icc || 0).toString());
  };


  const handleThicknessChange = (value: string) => {
    setThickness(value);
    let options = [];
    switch (value) {
      case "2":
        options = ["12"];
        break;
      case "4":
        options = ["12", "18", "25"];
        break;
      case "5":
        options = [
          "12",
          "15",
          "20",
          "25",
          "30",
          "32",
          "40",
          "50",
          "60",
          "63",
          "80",
          "100",
          "125",
          "150",
        ];
        break;
      case "10":
        options = [
          "10",
          "20",
          "30",
          "40",
          "50",
          "60",
          "80",
          "100",
          "120",
          "150",
          "160",
          "200",
        ];
        break;
      default:
        options = [];
    }
    setWidthOptions(options);
    setWidth(options[0] || "");
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let calculatedIpk = 0;
      if (icc <= 5) {
        calculatedIpk = icc * 1.5;
      } else if (icc <= 10) {
        calculatedIpk = icc * 1.7;
      } else if (icc <= 20) {
        calculatedIpk = icc * 2;
      } else if (icc <= 50) {
        calculatedIpk = icc * 2.1;
      } else {
        calculatedIpk = icc * 2.2;
      }
      setIpk(calculatedIpk);

      const calculatedA = 75;
      const calculatedB = 525;
      setSpaceBetweenPhases(calculatedA);
      setDistanceBetweenFixingPoints(calculatedB);

      const response = await axios.post(
        "http://127.0.0.1:8000/api/queryBusbar",
        {
          perPhase,
          thickness,
          width,
          poles,
          shape,
          icc,
        }
      );
      setProducts(response.data.products);
      if (response.data.products.length > 0) {
        handleRowClick(response.data.products[0]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (product) => {
    setSelectedProduct(product);

    const additionalInfo = product.additionalInfo?.[0];
    if (!additionalInfo) {
      console.warn("No additionalInfo found for product:", product);
      setImage1("/unknown.jpg");
      setImage2("/unknown.jpg");
      setImage3("/unknown.jpg");
      setSpaceBetweenPhases(0);
      setDistanceBetweenFixingPoints(0);
      return;
    }

const imageBase = `/products/${product.component_id}-${additionalInfo.resmini * 10}-${additionalInfo.nbphase}`;
const remoteImg1Url = `https://eriflex-configurator.nvent.com/eriflex/design/photo_articles/${additionalInfo.img1Article}.jpg`;
const remoteImg2Url = `https://eriflex-configurator.nvent.com/eriflex/design/photo_articles/${additionalInfo.img2Article}.jpg`;

const getApiImageUrl = (path: string) => `http://127.0.0.1:8000/api/getImage?path=${encodeURIComponent(path)}`;

// Helper function dùng axios để thử lần lượt các đuôi file
const tryImageWithExtensions = async (
  basePath: string,
  index: number,
  remoteFallbackUrl: string,
  setImage: (url: string) => void
) => {
  const extensions = ['jpg', 'png'];
  for (const ext of extensions) {
    const relativePath = `${basePath}-${index}.${ext}`;
    const apiUrl = getApiImageUrl(relativePath);
    try {
      const response = await axios.get(apiUrl, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(response.data);
      setImage(blobUrl);
      return; // Thành công thì dừng luôn
    } catch (error) {
      // Thử tiếp đuôi khác
    }
  }
  // Nếu tất cả đều lỗi → dùng ảnh remote
  setImage(remoteFallbackUrl);
};

// Gọi async
tryImageWithExtensions(imageBase, 1, remoteImg1Url, setImage1);
tryImageWithExtensions(imageBase, 2, remoteImg2Url, setImage2);
tryImageWithExtensions(imageBase, 3, "/unknown.jpg", setImage3);


    const Amini = additionalInfo.Amini || 0;
    const Bmini = additionalInfo.Bmini || 0;
    setSpaceBetweenPhases(Amini);
    setDistanceBetweenFixingPoints(Bmini);

    console.log("Selected Product Parameters:", {
      Amini,
      width,
      thickness,
      angle: additionalInfo.angle || 0,
      Bmini,
      Force: additionalInfo.resmini * 10 || 0,
    });
  };

  const generateFileLink = (product, docType) => {
  if (!product?.component_id || !product?.additionalInfo?.[0]?.resmini) {
    return '#'; // Fallback if data is missing
  }
  const componentId = product.component_id;
  const resmini = product.additionalInfo[0].resmini * 10; // Match Products.jsx scaling
  const suffix = docType === 'doc' ? 'doc' : docType === '2d' ? '2d' : '3d';
  // Default extension for 3d is stp; for doc and 2d, try pdf first
  const extension = docType === '3d' ? 'stp' : 'pdf';
  const filePath = `/documents/${componentId}-${resmini}-${suffix}.${extension}`;
  return `http://127.0.0.1:8000/api/getFile?path=${encodeURIComponent(filePath)}`;
};

  return (
    <div className="min-h-screen grid grid-cols-[20%_1fr] gap-4 p-4">
      {/* Left Section: Input Options */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold mb-2 text-red-500">Busbar Support</h1>
        <label className="flex flex-col">
          <span className="mb-1 font-medium">Per Phase</span>
          <Select value={perPhase} onValueChange={setPerPhase}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Per Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1 Busbar">1 Busbar</SelectItem>
              <SelectItem value="2 Busbar">2 Busbar</SelectItem>
              <SelectItem value="3 Busbar">3 Busbar</SelectItem>
              <SelectItem value="4 Busbar">4 Busbar</SelectItem>
              <SelectItem value="5 Busbar">5 Busbar</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <div className="flex gap-2">
          <label className="flex flex-col w-1/2">
            <span className="mb-1 font-medium">Thickness</span>
            <Select value={thickness} onValueChange={handleThicknessChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Thickness" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-col w-1/2">
            <span className="mb-1 font-medium">Width</span>
            <Select
              value={width}
              onValueChange={setWidth}
              disabled={widthOptions.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Width" />
              </SelectTrigger>
              <SelectContent>
                {widthOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
        <div className="flex flex-col">
          <span className="mb-1 font-medium">Poles</span>
          <div className="flex gap-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="poles"
                value="Bi"
                checked={poles === "Bi"}
                onChange={(e) => setPoles(e.target.value)}
                className="form-radio"
              />
              Bi
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="poles"
                value="Three"
                checked={poles === "Three"}
                onChange={(e) => setPoles(e.target.value)}
                className="form-radio"
              />
              Three
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="poles"
                value="Four"
                checked={poles === "Four"}
                onChange={(e) => setPoles(e.target.value)}
                className="form-radio"
              />
              Four
            </label>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="mb-1 font-medium">Shape</span>
          <table className="border-collapse border border-black">
            <tbody>
              <tr>
                {[
                  { value: "C", src: "/shape/shapeC.gif" },
                  { value: "P", src: "/shape/shapeP.gif" },
                  { value: "I", src: "/shape/shapeI.gif" },
                  { value: "E", src: "/shape/shapeE.gif" },
                ].map((shapeOption) => (
                  <td key={shapeOption.value} className="border border-black">
                    <img
                      src={shapeOption.src}
                      alt={`Shape ${shapeOption.value}`}
                      className="w-8 h-8 object-contain"
                    />
                  </td>
                ))}
              </tr>
              <tr>
                {["C", "P", "I", "E"].map((value) => (
                  <td key={value}>
                    <input
                      type="radio"
                      name="shape"
                      value={value}
                      checked={shape === value}
                      onChange={(e) => setShape(e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <label className="flex flex-col">
          <span className="mb-1 font-medium">Icc3 (kA effective)</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleIccChange(e.target.value)}
            onBlur={handleBlur}
            className="border border-gray-300 rounded px-2 py-1"
            pattern="[0-9]*\.?[0-9]*"
          />
        </label>
        <label className="flex flex-col">
          <span className="mb-1 font-medium">Ipk (kA peak)</span>
          <input
            type="number"
            value={ipk.toFixed(2)}
            readOnly
            className="border border-gray-300 rounded px-2 py-1 bg-gray-100"
          />
        </label>
        <div className="flex flex-col gap-1 mt-2">
          <span className="font-medium">Space between phases (A)</span>
          <Select
            value={spaceBetweenPhases.toString()}
            onValueChange={async (value) => {
              const newA = Number(value);
              setSpaceBetweenPhases(newA);

              if (selectedProduct) {
                try {
                  const polesMapping = { Bi: 2, Three: 3, Four: 4 };
                  const numericPoles = polesMapping[poles] || parseInt(poles, 10) || 0;

                  const response = await axios.post(
                    "http://127.0.0.1:8000/api/calcExcel",
                    {
                      W: parseInt(width),
                      T: parseInt(thickness),
                      B: parseInt(perPhase),
                      Angle: parseInt(
                        selectedProduct?.additionalInfo?.[0]?.angle || 0
                      ),
                      a: newA,
                      Icc: parseInt(icc),
                      Force: parseInt(
                        selectedProduct?.additionalInfo?.[0]?.resmini * 10 || 0
                      ),
                      NbrePhase: numericPoles,
                    }
                  );

                  if (response.data.L) {
                    setProducts((prevProducts) =>
                      prevProducts.map((p) =>
                        p.id === selectedProduct.id
                          ? {
                              ...p,
                              additionalInfo: [
                                {
                                  ...p.additionalInfo[0],
                                  L: response.data.L,
                                  Amini: newA,
                                },
                              ],
                            }
                          : p
                      )
                    );
                    setSelectedProduct((prev) => ({
                      ...prev,
                      additionalInfo: [
                        {
                          ...prev.additionalInfo[0],
                          L: response.data.L,
                          Amini: newA,
                        },
                      ],
                    }));
                  }
                } catch (error) {
                  console.error("Error calculating L:", error);
                }
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select A" />
            </SelectTrigger>
            <SelectContent>
              {selectedProduct?.additionalInfo?.[0]?.a_list
                ?.split(",")
                .map((value) => (
                  <SelectItem key={value.trim()} value={value.trim()}>
                    {value.trim()}
                  </SelectItem>
                )) || <SelectItem value="0">No options available</SelectItem>}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <span className="font-medium">Distance between fixing points (B)</span>
          <input
            type="number"
            value={distanceBetweenFixingPoints}
            onChange={(e) =>
              setDistanceBetweenFixingPoints(Number(e.target.value))
            }
            className="border border-gray-300 rounded px-2 py-1"
          />
        </div>
        <button
          onClick={fetchProducts}
          className="mt-2 bg-blue-500 text-white py-2 px-4 rounded flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              Loading...
            </>
          ) : (
            "Search Products"
          )}
        </button>
      </div>

      {/* Right Section: Product Table */}
      <div
        className="flex flex-col items-center justify-start border-l pl-4 w-full"
        style={{
          backgroundImage: "url('/3274406.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <svg
              className="animate-spin h-10 w-10 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <p className="text-blue-500 mt-2">Loading product information...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4 text-blue-500">
              N° { selectedProduct?.component_id || "No Product Selected"} Designation :{" "}
              {selectedProduct?.additionalInfo?.[0]?.info || "No Product Selected"}
            </h1>
            <hr className="w-full border-t border-gray-300 mb-2" />
            <p className="text-sm text-gray-600 font-bold">
              Data and Calculations in accordance with IEC 61 439 and for BERLIVN's products only
            </p>
            <hr className="w-full border-t border-gray-300 mb-6" />
            <div
              className="flex gap-6 mb-6 p-4 rounded-lg"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              <img
                src={image1}
                alt="Image 1"
                className="w-64 h-auto max-h-64 object-contain border border-gray-300 rounded-lg"
              />
              <img
                src={image2}
                alt="Image 2"
                className="w-64 h-auto max-h-64 object-contain border border-gray-300 rounded-lg"
              />
              <img
                src={image3}
                alt="Image 3"
                className="w-64 h-auto max-h-64 object-contain border border-gray-300 rounded-lg"
              />
            </div>
            <Bus
              leftValue={
                selectedProduct?.additionalInfo?.[0]?.L
                  ? Math.ceil(selectedProduct.additionalInfo[0].L / 4)
                  : "N/A"
              }
              centerValue={selectedProduct?.additionalInfo?.[0]?.L || "N/A"}
            />
            <hr className="w-full border-t border-gray-300 mb-6" />
            <div
              className="w-full p-4 rounded-lg"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              {filteredProducts.length > 0 ? (
                <>
                  <div className="mb-4">
                    <button
                      onClick={() => setShowOnlyWithImg1(!showOnlyWithImg1)}
                      className="bg-blue-500 text-white py-2 px-4 rounded"
                    >
                      {showOnlyWithImg1 ? "Show All Products" : "Show BERLIVN Products"}
                    </button>
                  </div>
                  <Table className="w-full border border-gray-300 rounded-lg">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component ID</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>A (mm)</TableHead>
                      <TableHead>L (mm)</TableHead>
                      <TableHead>L' (mm)</TableHead>
                      <TableHead>Angle</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Link Doc</TableHead>
                      <TableHead>Link 2D</TableHead>
                      <TableHead>Link 3D</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className={`cursor-pointer ${
                          selectedProduct?.id === product.id ? "bg-yellow-400" : ""
                        }`}
                        onClick={() => handleRowClick(product)}
                      >
                        <TableCell>{product.component_id}</TableCell>
                        <TableCell>
                          {product.additionalInfo?.[0]?.info || "N/A"}
                        </TableCell>
                        <TableCell>
                          {product.additionalInfo?.[0]?.Amini || "N/A"}
                        </TableCell>
                        <TableCell>
                          {product.additionalInfo?.[0]?.L || "N/A"}
                        </TableCell>
                        <TableCell>
                          {product.additionalInfo?.[0]?.L
                            ? Math.ceil(product.additionalInfo[0].L / 4)
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {product.additionalInfo?.[0]?.angle || "N/A"}
                        </TableCell>
                        <TableCell>
                          <input
                            type="number"
                            value={quantities[product.id] || ""}
                            onChange={(e) =>
                              handleQuantityChange(product.id, e.target.value)
                            }
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="number"
                            value={prices[product.id] || ""}
                            onChange={(e) =>
                              handlePriceChange(product.id, e.target.value)
                            }
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        </TableCell>
                        <TableCell>{calculateTotal(product.id)}</TableCell>
                        <TableCell>
                          <a
                            href={generateFileLink(product, 'doc')}
                            className="text-blue-600 hover:underline"
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                const componentId = product.component_id;
                                const resmini = product.additionalInfo[0].resmini * 10;
                                const perPhase = product.additionalInfo[0].nbphase;
                                const extensions = ['pdf', 'doc', 'docx'];
                                for (const ext of extensions) {
                                  const filePath = `/documents/${componentId}-${resmini}-${perPhase}-doc.${ext}`;
                                  const response = await axios.get(
                                    `http://127.0.0.1:8000/api/getFile?path=${encodeURIComponent(filePath)}`,
                                    { responseType: 'blob' }
                                  );
                                  if (response.status === 200) {
                                    const url = URL.createObjectURL(response.data);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `${componentId}-${resmini}-doc.${ext}`;
                                    link.click();
                                    URL.revokeObjectURL(url);
                                    return;
                                  }
                                }
                                // setError('Tài liệu DOC không tồn tại');
                              } catch (err) {
                                 alert('Không tìm thấy file!');
                                // setError('Lỗi khi tải tài liệu DOC');
                              }
                            }}
                          >
                            Tải xuống
                          </a>
                        </TableCell>
                        <TableCell>
                          <a
                            href={generateFileLink(product, '2d')}
                            className="text-blue-600 hover:underline"
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                const componentId = product.component_id;
                                const resmini = product.additionalInfo[0].resmini * 10;
                                const perPhase = product.additionalInfo[0].nbphase;
                                const extensions = ['pdf', 'doc', 'docx'];
                                for (const ext of extensions) {
                                  const filePath = `/documents/${componentId}-${resmini}-${perPhase}-2d.${ext}`;
                                  const response = await axios.get(
                                    `http://127.0.0.1:8000/api/getFile?path=${encodeURIComponent(filePath)}`,
                                    { responseType: 'blob' }
                                  );
                                  if (response.status === 200) {
                                    const url = URL.createObjectURL(response.data);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `${componentId}-${resmini}-2d.${ext}`;
                                    link.click();
                                    URL.revokeObjectURL(url);
                                    return;
                                  }
                                  else {
                                    alert('Không tìm thấy file!');
                                  }
                                }
                                // setError('Tài liệu 2D không tồn tại');
                              } catch (err) {
                                 alert('Không tìm thấy file!');
                                // setError('Lỗi khi tải tài liệu 2D');
                              }
                            }}
                          >
                            Tải xuống
                          </a>
                        </TableCell>
                        <TableCell>
                          <a
                            href={generateFileLink(product, '3d')}
                            className="text-blue-600 hover:underline"
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                const componentId = product.component_id;
                                const resmini = product.additionalInfo[0].resmini * 10;
                                const perPhase = product.additionalInfo[0].nbphase;
                                // Try common extensions for 3d (since any file type is allowed)
                                const extensions = ['stp', 'step', 'obj', 'pdf', 'txt']; // Fallbacks
                                for (const ext of extensions) {
                                  const filePath = `/documents/${componentId}-${resmini}-${perPhase}-3d.${ext}`;
                                  const response = await axios.get(
                                    `http://127.0.0.1:8000/api/getFile?path=${encodeURIComponent(filePath)}`,
                                    { responseType: 'blob' }
                                  );
                                  if (response.status === 200) {
                                    const url = URL.createObjectURL(response.data);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `${componentId}-${resmini}-3d.${ext}`;
                                    link.click();
                                    URL.revokeObjectURL(url);
                                    return;
                                  }
                                  else {
                                    alert('Không tìm thấy file!');
                                  }
                                }
                                // setError('Tài liệu 3D không tồn tại');
                              } catch (err) {
                                // setError('Lỗi khi tải tài liệu 3D');
                                 alert('Không tìm thấy file!');
                              }
                            }}
                          >
                            Tải xuống
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  <div className="flex justify-center items-center mt-4 gap-2">
                    {Array.from({ length: totalPages }, (_, index) => (
                      <button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-3 py-1 rounded ${
                          currentPage === index + 1
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center text-lg">No products found.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}