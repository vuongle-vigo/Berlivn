import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDailySearchLimit,
  decrementDailySearchLimit,
  queryBusbar,
  getImageBlobByPath,
  getFileLink,
  calcExcel,
} from "@/api/api";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import BusbarCanvas from "@/components/BusbarCanvas";

interface BusbarCalculatorProps {
  onSearchComplete?: () => void;
  currentUser?: any;
  isCurrentAdmin?: boolean;
}

export default function BusbarCalculator({
  onSearchComplete,
  currentUser,
  isCurrentAdmin,
}: BusbarCalculatorProps) {
  const { user: authUser, isAdmin: authIsAdmin } = useAuth();

  // Prioritize props from App.tsx which handles local storage fallback
  const user = currentUser || authUser;
  const isAdmin = isCurrentAdmin !== undefined ? isCurrentAdmin : authIsAdmin;

  const [remainingSearches, setRemainingSearches] = useState<number>(0);
  const [canSearch, setCanSearch] = useState<boolean>(true);

  const [perPhase, setPerPhase] = useState("1 Busbar");
  const [thickness, setThickness] = useState("2");
  const [widthOptions, setWidthOptions] = useState(["12"]);
  const [width, setWidth] = useState("12");
  const [poles, setPoles] = useState("Four");
  const [shape, setShape] = useState("C");
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
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
  const itemsPerPage = 10;
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState("12");

  useEffect(() => {
    const fetchUserLimit = async () => {
      if (user?.id && !isAdmin) {
        const res = await getDailySearchLimit(user.id);
        if (res.ok && res.data) {
          const remaining = Number(
            res.data.daily_search_remaining ??
              res.data.daily_search_limit ??
              0
          );
          setRemainingSearches(remaining);
          setCanSearch(remaining > 0);
        } else {
          setRemainingSearches(0);
          setCanSearch(false);
        }
      } else if (isAdmin) {
        setCanSearch(true);
      }
    };
    fetchUserLimit();
  }, [user, isAdmin]);

  const handleQuantityChange = (id: string, value: string) => {
    setQuantities((prev) => ({ ...prev, [id]: value }));
  };

  const handlePriceChange = (id: string, value: string) => {
    setPrices((prev) => ({ ...prev, [id]: value }));
  };

  const calculateTotal = (id: string) => {
    const quantity = Number(quantities[id] || 0);
    const price = Number(prices[id] || 0);
    return (quantity * price).toFixed(2);
  };

  const handleSpaceBetweenPhasesSelect = async (value: string) => {
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      if (selectedProduct && numericValue !== spaceBetweenPhases) {
        const addInfo = selectedProduct.additionalInfo?.[0];
        const perPhaseNumber = parseInt(perPhase);
        const pay = {
          W: parseInt(width),
          T: parseInt(thickness),
          B: perPhaseNumber,
          Angle: addInfo?.angle || 0,
          a: numericValue,
          Icc: icc,
          Force: addInfo?.resmini,
          NbrePhase: addInfo?.nbphase,
        };
        const result = await calcExcel(pay);
        if (result?.ok && result.data) {
          const L = Number(result.data.L ?? result.data.l ?? 0);
          const B = Number(
            result.data.B ?? result.data.b ?? distanceBetweenFixingPoints
          );
          const updatedProduct =
            selectedProduct.additionalInfo?.length
              ? {
                  ...selectedProduct,
                  additionalInfo: selectedProduct.additionalInfo.map(
                    (info: any, idx: number) =>
                      idx === 0
                        ? { ...info, L, Amini: numericValue, Bmini: B }
                        : info
                  ),
                }
              : selectedProduct;

          setSelectedProduct(updatedProduct);
          setProducts((prev) =>
            prev.map((item) =>
              item.id === updatedProduct.id ? updatedProduct : item
            )
          );
          setDistanceBetweenFixingPoints(B);
        }
      }
      setSpaceBetweenPhases(numericValue);
    }
  };

  const filteredProducts = products;

  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleIccChange = (value: string) => {
    const cleanedValue =
      value.replace(/^0+/, "").replace(/[^\d.]/g, "") || "0";
    setInputValue(cleanedValue);
    const numericValue = Math.min(Math.max(Number(cleanedValue), 12), 200);
    setIcc(numericValue || 0);
  };

  const handleBlur = () => {
    setInputValue((icc || 0).toString());
  };

  const handleThicknessChange = (value: string) => {
    setThickness(value);
    let options: string[] = [];
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
    if (!isAdmin && remainingSearches <= 0) {
      alert(`Bạn đã hết lượt tra cứu hôm nay. Còn lại: ${remainingSearches} lượt`);
      return;
    }

    setLoading(true);
    try {
      let calculatedIpk = 0;
      if (icc <= 5) calculatedIpk = icc * 1.5;
      else if (icc <= 10) calculatedIpk = icc * 1.7;
      else if (icc <= 20) calculatedIpk = icc * 2;
      else if (icc <= 50) calculatedIpk = icc * 2.1;
      else calculatedIpk = icc * 2.2;
      setIpk(calculatedIpk);

      const calculatedA = 75;
      const calculatedB = 525;
      setSpaceBetweenPhases(calculatedA);
      setDistanceBetweenFixingPoints(calculatedB);

      try {
        const response = await queryBusbar({
          perPhase,
          thickness,
          width,
          poles,
          shape,
          icc,
        });

        if (response.ok && response.data) {
          setProducts(response.data.products || []);
          if (response.data.products && response.data.products.length > 0) {
            handleRowClick(response.data.products[0]);
          }

          if (!isAdmin && user?.id) {
            const decRes = await decrementDailySearchLimit(user.id);
            if (decRes.ok && decRes.data) {
              const nextRemaining = Number(
                decRes.data.daily_search_remaining ?? remainingSearches
              );
              setRemainingSearches(nextRemaining);
              setCanSearch(nextRemaining > 0);
              if (onSearchComplete) onSearchComplete();
            } else {
              alert("Không thể cập nhật lượt tra cứu. Vui lòng thử lại sau.");
            }
          }
        } else {
          console.error("Failed to query products", response.status);
        }
      } catch (error) {
        console.error("Error querying busbar products:", error);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (product: any) => {
    setSelectedProduct(product);

    const additionalInfo = product.additionalInfo?.[0];
    if (!additionalInfo) {
      setImage1("/unknown.jpg");
      setImage2("/unknown.jpg");
      setImage3("/unknown.jpg");
      setSpaceBetweenPhases(0);
      setDistanceBetweenFixingPoints(0);
      return;
    }

    const imageBase = `/products/${product.component_id}-${
      additionalInfo.resmini * 10
    }-${additionalInfo.nbphase}`;

    const remoteImg1Url = `https://eriflex-configurator.nvent.com/eriflex/design/photo_articles/${additionalInfo.img1Article}.jpg`;
    const remoteImg2Url = `https://eriflex-configurator.nvent.com/eriflex/design/photo_articles/${additionalInfo.img2Article}.jpg`;

    const tryImageWithExtensions = async (
      basePath: string,
      index: number,
      remoteFallbackUrl: string,
      setImage: (url: string) => void
    ) => {
      const extensions = ["jpg", "png"];
      for (const ext of extensions) {
        const relativePath = `${basePath}-${index}.${ext}`;
        const { ok, blob } = await getImageBlobByPath(relativePath);
        if (ok && blob) {
          const blobUrl = URL.createObjectURL(blob);
          setImage(blobUrl);
          return;
        }
      }
      setImage(remoteFallbackUrl);
    };

    tryImageWithExtensions(imageBase, 1, remoteImg1Url, setImage1);
    tryImageWithExtensions(imageBase, 2, remoteImg2Url, setImage2);
    tryImageWithExtensions(imageBase, 3, "/unknown.jpg", setImage3);

    const Amini = additionalInfo.Amini || 0;
    const Bmini = additionalInfo.Bmini || 0;
    setSpaceBetweenPhases(Amini);
    setDistanceBetweenFixingPoints(Bmini);
  };

  const generateFileLink = (product: any, docType: string) => {
    if (!product?.component_id || !product?.additionalInfo?.[0]?.resmini) {
      return "#";
    }
    const componentId = product.component_id;
    const resmini = product.additionalInfo[0].resmini * 10;
    const nbphase = product.additionalInfo[0].nbphase;
    const suffix = docType === "doc" ? "doc" : docType === "2d" ? "2d" : "3d";
    const extension = docType === "3d" ? "stp" : "pdf";
    const filePath = `/documents/${componentId}-${resmini}-${nbphase}-${suffix}.${extension}`;

    return getFileLink(filePath);
  };

  return (
    // ✅ full width (no max-w limit)
    <div className="w-full px-3 sm:px-4 lg:px-6 py-3">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-3">
        {/* LEFT: compact form */}
        <aside className="bg-white border rounded-md p-3">
          <h2 className="text-lg font-bold text-red-600 mb-2">Busbar Support</h2>

          <div className="space-y-3 text-sm">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Per Phase
              </label>
              <Select value={perPhase} onValueChange={setPerPhase}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="Select Per Phase" />
                </SelectTrigger>
                <SelectContent>
                  {["1 Busbar", "2 Busbar", "3 Busbar", "4 Busbar", "5 Busbar"].map(
                    (val) => (
                      <SelectItem key={val} value={val}>
                        {val}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Thickness
                </label>
                <Select value={thickness} onValueChange={handleThicknessChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["2", "4", "5", "10"].map((val) => (
                      <SelectItem key={val} value={val}>
                        {val}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Width
                </label>
                <Select
                  value={width}
                  onValueChange={setWidth}
                  disabled={widthOptions.length === 0}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {widthOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Poles
              </label>
              <div className="flex gap-2 flex-wrap">
                {["Bi", "Three", "Four"].map((pole) => (
                  <label key={pole} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="poles"
                      value={pole}
                      checked={poles === pole}
                      onChange={(e) => setPoles(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{pole}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Shape
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["C", "P", "I", "E"].map((s) => (
                  <label
                    key={s}
                    className="flex flex-col items-center cursor-pointer border rounded p-2 hover:bg-gray-50"
                  >
                    <div className="text-lg font-bold text-gray-400 leading-none">
                      {s}
                    </div>
                    <input
                      type="radio"
                      name="shape"
                      value={s}
                      checked={shape === s}
                      onChange={(e) => setShape(e.target.value)}
                      className="w-4 h-4 text-blue-600 mt-1"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Icc3 (kA effective)
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleIccChange(e.target.value)}
                onBlur={handleBlur}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Ipk (kA peak)
              </label>
              <input
                type="text"
                value={ipk.toFixed(2)}
                readOnly
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-gray-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Space between phases (mm)
              </label>
              <Select
                value={spaceBetweenPhases.toString()}
                onValueChange={handleSpaceBetweenPhasesSelect}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedProduct?.additionalInfo?.[0]?.a_list
                    ?.split(",")
                    .map((value: string) => (
                      <SelectItem key={value.trim()} value={value.trim()}>
                        {value.trim()}
                      </SelectItem>
                    )) || <SelectItem value="0">No options</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Distance between fixing points (mm)
              </label>
              <input
                type="number"
                value={distanceBetweenFixingPoints}
                onChange={(e) =>
                  setDistanceBetweenFixingPoints(Number(e.target.value))
                }
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md"
              />
            </div>

            {!isAdmin && (
              <Alert>
                <AlertDescription className="text-sm">
                  Số lượt tra cứu còn lại hôm nay:{" "}
                  <strong>{remainingSearches}</strong>
                </AlertDescription>
              </Alert>
            )}

            <button
              onClick={fetchProducts}
              disabled={loading || (!isAdmin && !canSearch)}
              className="w-full bg-blue-600 text-white h-9 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Loading..." : "Search Products"}
            </button>
          </div>
        </aside>

        {/* RIGHT: one compact panel */}
        <main className="bg-white border rounded-md p-3 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-sm text-gray-600">
              Loading product information...
            </div>
          ) : (
            <>
              <div className="text-center text-lg font-bold text-blue-600 mb-2">
                {selectedProduct?.additionalInfo?.[0]?.info || "Bar Support"}
              </div>

              {/* compact images (no border, smaller) */}
              <div className="mb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded flex items-center justify-center">
                  <img
                    src={image1}
                    alt="Image 1"
                    className="w-full h-auto max-h-[260px] object-contain"
                  />
                </div>

                <div className="bg-gray-50 rounded flex items-center justify-center">
                  <img
                    src={image2}
                    alt="Image 2"
                    className="w-full h-auto max-h-[260px] object-contain"
                  />
                </div>
              </div>
            </div>
              <div className="mb-3">
                <BusbarCanvas
                  leftValue={
                    selectedProduct?.additionalInfo?.[0]?.L
                      ? Math.ceil(selectedProduct.additionalInfo[0].L / 4).toString()
                      : "N/A"
                  }
                  centerValue={
                    selectedProduct?.additionalInfo?.[0]?.L?.toString() || "N/A"
                  }
                />
              </div>

              {/* TABLE: compact + NO horizontal scroll */}
              <div className="overflow-x-hidden overflow-y-auto max-h-[360px] rounded-md border">
                <Table className="w-full table-auto text-xs">
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="py-2 px-2 whitespace-nowrap">
                        Component ID
                      </TableHead>
                      <TableHead className="py-2 px-2">Product Name</TableHead>
                      <TableHead className="py-2 px-2 text-center whitespace-nowrap">
                        A
                      </TableHead>
                      <TableHead className="py-2 px-2 text-center whitespace-nowrap">
                        L
                      </TableHead>
                      <TableHead className="hidden lg:table-cell py-2 px-2 text-center whitespace-nowrap">
                        L&apos;
                      </TableHead>
                      <TableHead className="hidden lg:table-cell py-2 px-2 text-center whitespace-nowrap">
                        Angle
                      </TableHead>
                      <TableHead className="py-2 px-2 text-center whitespace-nowrap">
                        Qty
                      </TableHead>
                      <TableHead className="py-2 px-2 text-center whitespace-nowrap">
                        Price
                      </TableHead>
                      <TableHead className="py-2 px-2 text-center whitespace-nowrap">
                        Total
                      </TableHead>
                      <TableHead className="py-2 px-2 text-center whitespace-nowrap w-14">
                        Doc
                      </TableHead>
                      <TableHead className="py-2 px-2 text-center whitespace-nowrap w-14">
                        2D
                      </TableHead>
                      <TableHead className="py-2 px-2 text-center whitespace-nowrap w-14">
                        3D
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {currentProducts.map((product: any) => (
                      <TableRow
                        key={product.id}
                        className={`cursor-pointer ${
                          selectedProduct?.id === product.id ? "bg-yellow-100" : ""
                        }`}
                        onClick={() => handleRowClick(product)}
                      >
                        <TableCell className="py-2 px-2 whitespace-nowrap">
                          {product.component_id}
                        </TableCell>

                        <TableCell className="py-2 px-2">
                          <div
                            className="truncate max-w-[260px]"
                            title={product.additionalInfo?.[0]?.info || ""}
                          >
                            {product.additionalInfo?.[0]?.info || "N/A"}
                          </div>
                        </TableCell>

                        <TableCell className="py-2 px-2 text-center whitespace-nowrap">
                          {product.additionalInfo?.[0]?.Amini || "N/A"}
                        </TableCell>

                        <TableCell className="py-2 px-2 text-center whitespace-nowrap">
                          {product.additionalInfo?.[0]?.L || "N/A"}
                        </TableCell>

                        <TableCell className="hidden lg:table-cell py-2 px-2 text-center whitespace-nowrap">
                          {product.additionalInfo?.[0]?.L
                            ? Math.ceil(product.additionalInfo[0].L / 4)
                            : "N/A"}
                        </TableCell>

                        <TableCell className="hidden lg:table-cell py-2 px-2 text-center whitespace-nowrap">
                          {product.additionalInfo?.[0]?.angle || "N/A"}
                        </TableCell>

                        <TableCell className="py-2 px-2">
                          <input
                            type="number"
                            value={quantities[product.id] || ""}
                            onChange={(e) =>
                              handleQuantityChange(product.id, e.target.value)
                            }
                            className="w-full h-7 px-2 text-xs border rounded"
                          />
                        </TableCell>

                        <TableCell className="py-2 px-2">
                          <input
                            type="number"
                            value={prices[product.id] || ""}
                            onChange={(e) =>
                              handlePriceChange(product.id, e.target.value)
                            }
                            className="w-full h-7 px-2 text-xs border rounded text-right"
                          />
                        </TableCell>

                        <TableCell className="py-2 px-2 text-center whitespace-nowrap">
                          {calculateTotal(product.id)}
                        </TableCell>

                        <TableCell className="py-2 px-2 text-center whitespace-nowrap w-14">
                          <a
                            href={generateFileLink(product, "doc")}
                            className="text-blue-600 hover:underline"
                          >
                            See
                          </a>
                        </TableCell>

                        <TableCell className="py-2 px-2 text-center whitespace-nowrap w-14">
                          <a
                            href={generateFileLink(product, "2d")}
                            className="text-blue-600 hover:underline"
                          >
                            See
                          </a>
                        </TableCell>

                        <TableCell className="py-2 px-2 text-center whitespace-nowrap w-14">
                          <a
                            href={generateFileLink(product, "3d")}
                            className="text-blue-600 hover:underline"
                          >
                            See
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap justify-center items-center mt-3 gap-2">
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-3 py-1 rounded text-sm ${
                      currentPage === index + 1
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
