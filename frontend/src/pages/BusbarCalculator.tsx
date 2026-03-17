import { useState, useEffect, useRef } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const isUserActive = user?.is_active === 1;

  const [inactiveAccountOpen, setInactiveAccountOpen] = useState(false);

  // Check if user can perform actions
  const checkActiveAndProceed = () => {
    if (user?.id && !isUserActive) {
      setInactiveAccountOpen(true);
      return false;
    }
    return true;
  };

  const [remainingSearches, setRemainingSearches] = useState<number>(0);
  const [canSearch, setCanSearch] = useState<boolean>(true);

  const [perPhase, setPerPhase] = useState("1 Busbar");
  const [thickness, setThickness] = useState("2");
  const [widthOptions, setWidthOptions] = useState(["12"]);
  const [width, setWidth] = useState("12");
  const [poles, setPoles] = useState<"Bi" | "Three" | "Four">("Four");
  const [shape, setShape] = useState<"C" | "P" | "I" | "E">("C");

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [image1, setImage1] = useState("/unknown.jpg");
  const [image2, setImage2] = useState("/unknown.jpg");
  const [image3, setImage3] = useState("/unknown.jpg");

  const image1UrlRef = useRef<string | null>(null);
  const image2UrlRef = useRef<string | null>(null);
  const image3UrlRef = useRef<string | null>(null);

  const [icc, setIcc] = useState(12);
  const [ipk, setIpk] = useState(0);

  const [spaceBetweenPhases, setSpaceBetweenPhases] = useState(75);
  const [distanceBetweenFixingPoints, setDistanceBetweenFixingPoints] =
    useState(525);

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState("12");

  const polesMapping: Record<"Bi" | "Three" | "Four", number> = {
    Bi: 2,
    Three: 3,
    Four: 4,
  };

  const getBusbarCount = (val: string) => {
    const n = Number(val.split(" ")[0]);
    return Number.isFinite(n) ? n : 0;
  };

  const revokeIfBlobUrl = (url: string | null) => {
    if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      revokeIfBlobUrl(image1UrlRef.current);
      revokeIfBlobUrl(image2UrlRef.current);
      revokeIfBlobUrl(image3UrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-show popup when user is inactive
  useEffect(() => {
    if (user?.id && !isUserActive) {
      setInactiveAccountOpen(true);
    }
  }, [user?.id, isUserActive]);

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
    const numValue = value.replace(/,/g, '');
    setQuantities((prev) => ({ ...prev, [id]: numValue }));
  };

  const handleQuantityBlur = (id: string, value: string) => {
    const formatted = formatWithCommas(value);
    setQuantities((prev) => ({ ...prev, [id]: formatted }));
  };

  const handlePriceChange = (id: string, value: string) => {
    const numValue = value.replace(/,/g, '');
    setPrices((prev) => ({ ...prev, [id]: numValue }));
  };

  const handlePriceBlur = (id: string, value: string) => {
    const formatted = formatWithCommas(value);
    setPrices((prev) => ({ ...prev, [id]: formatted }));
  };

  const formatWithCommas = (value: string) => {
    const num = Number(value.replace(/,/g, ''));
    if (isNaN(num) || value === '') return value;
    return num.toLocaleString('en-US');
  };

  const calculateTotal = (id: string) => {
    const quantity = Number(String(quantities[id] || 0).replace(/,/g, ''));
    const price = Number(String(prices[id] || 0).replace(/,/g, ''));
    const total = quantity * price;
    return total.toLocaleString('en-US');
  };

  const handleSpaceBetweenPhasesSelect = async (value: string) => {
    if (!checkActiveAndProceed()) return;

    const a = Number(value);
    if (Number.isNaN(a)) return;

    setSpaceBetweenPhases(a);

    if (!selectedProduct) return;

    const addInfo = selectedProduct.additionalInfo?.[0];
    if (!addInfo) return;

    const busbarCount = getBusbarCount(perPhase);
    const nbrePhase = polesMapping[poles] ?? 0;

    const pay = {
      W: Number(width) || 0,
      T: Number(thickness) || 0,
      B: busbarCount,
      Angle: Number(addInfo?.angle) || 0,
      a,
      Icc: Number(icc) || 0,
      Force: Math.round((addInfo?.resmini ?? 0) * 10), // ✅ match old project
      NbrePhase: nbrePhase, // ✅ match old project (from poles)
    };

    const result = await calcExcel(pay);
    if (result?.ok && result.data) {
      const L = Number(result.data.L ?? result.data.l ?? 0);
      const Bfix = Number(
        result.data.B ?? result.data.b ?? distanceBetweenFixingPoints
      );

      const updatedProduct = {
        ...selectedProduct,
        additionalInfo: (selectedProduct.additionalInfo || []).map(
          (info: any, idx: number) =>
            idx === 0 ? { ...info, L, Amini: a, Bmini: Bfix } : info
        ),
      };

      setSelectedProduct(updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
      );
      setDistanceBetweenFixingPoints(Bfix);
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
    // allow only 1 decimal dot
    let cleaned = value.replace(/^0+/, "").replace(/[^\d.]/g, "") || "0";
    cleaned = cleaned.replace(/(\..*)\./g, "$1");
    setInputValue(cleaned);

    const numericValue = Math.min(Math.max(Number(cleaned), 12), 200);
    setIcc(Number.isFinite(numericValue) ? numericValue : 0);
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
    if (!checkActiveAndProceed()) return;

    if (!isAdmin && remainingSearches <= 0) {
      alert(
        `Bạn đã hết lượt tra cứu hôm nay. Còn lại: ${remainingSearches} lượt`
      );
      return;
    }

    setLoading(true);
    try {
      // ✅ match old ipk mapping
      let calculatedIpk = 0;
      if (icc <= 5) calculatedIpk = icc * 1.5;
      else if (icc <= 10) calculatedIpk = icc * 1.7;
      else if (icc <= 20) calculatedIpk = icc * 2;
      else if (icc <= 50) calculatedIpk = icc * 2.1;
      else calculatedIpk = icc * 2.2;
      setIpk(calculatedIpk);

      // ✅ default A/B like old project
      setSpaceBetweenPhases(75);
      setDistanceBetweenFixingPoints(525);

      const response = await queryBusbar({
        perPhase,
        thickness,
        width,
        poles,
        shape,
        icc,
      });

      if (response.ok && response.data) {
        const list = response.data.products || [];
        setProducts(list);
        setCurrentPage(1); // ✅ avoid empty page after new search

        if (list.length > 0) {
          await handleRowClick(list[0]);
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
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (product: any) => {
    setSelectedProduct(product);

    const additionalInfo = product.additionalInfo?.[0];
    if (!additionalInfo) {
      // cleanup blobs
      revokeIfBlobUrl(image1UrlRef.current);
      revokeIfBlobUrl(image2UrlRef.current);
      revokeIfBlobUrl(image3UrlRef.current);
      image1UrlRef.current = null;
      image2UrlRef.current = null;
      image3UrlRef.current = null;

      setImage1("/unknown.jpg");
      setImage2("/unknown.jpg");
      setImage3("/unknown.jpg");
      setSpaceBetweenPhases(75);
      setDistanceBetweenFixingPoints(525);
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
      setImage: (url: string) => void,
      ref: React.MutableRefObject<string | null>
    ) => {
      const extensions = ["jpg", "png"];
      for (const ext of extensions) {
        const relativePath = `${basePath}-${index}.${ext}`;
        const { ok, blob } = await getImageBlobByPath(relativePath);
        if (ok && blob) {
          const blobUrl = URL.createObjectURL(blob);

          // revoke old
          revokeIfBlobUrl(ref.current);
          ref.current = blobUrl;

          setImage(blobUrl);
          return;
        }
      }

      // revoke old blob if switching to remote/static
      revokeIfBlobUrl(ref.current);
      ref.current = null;

      setImage(remoteFallbackUrl);
    };

    tryImageWithExtensions(imageBase, 1, remoteImg1Url, setImage1, image1UrlRef);
    tryImageWithExtensions(imageBase, 2, remoteImg2Url, setImage2, image2UrlRef);
    tryImageWithExtensions(imageBase, 3, "/unknown.jpg", setImage3, image3UrlRef);

    // ✅ fallback to defaults (avoid 0)
    setSpaceBetweenPhases(additionalInfo.Amini ?? 75);
    setDistanceBetweenFixingPoints(additionalInfo.Bmini ?? 525);
  };

  const generateFileLink = (product: any, docType: string) => {
    if (!checkActiveAndProceed()) return "#";

    if (!product?.component_id || !product?.additionalInfo?.[0]?.resmini) {
      return "#";
    }
    const componentId = product.component_id;
    const resmini = product.additionalInfo[0].resmini * 10;
    const nbphase = product.additionalInfo[0].nbphase;
    const suffix = docType === "doc" ? "doc" : docType === "2d" ? "2d" : "3d";
    const extension = docType === "3d" ? "stp" : "pdf";

    // ✅ unify with old download format: include nbphase
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
                {(["Bi", "Three", "Four"] as const).map((pole) => (
                  <label
                    key={pole}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="poles"
                      value={pole}
                      checked={poles === pole}
                      onChange={(e) => setPoles(e.target.value as any)}
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
                {(["C", "P", "I", "E"] as const).map((s) => (
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
                      onChange={(e) => setShape(e.target.value as any)}
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
              disabled={loading || !isUserActive || (!isAdmin && !canSearch)}
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
              {/* Product Selection Header - Show when product is selected */}
              {selectedProduct && (
                <div className="mb-2">
                <p className="text-lg text-left text-red-600 font-medium">
                  Data and Calculations in accordance with IEC 61439 and for BERLIVN's product only
                </p>
                  <hr className="my-1 border-red-300" />
                  <p className="text-base text-left text-blue-600 font-semibold">
                    YOU ARE SELECTING PRODUCT CODE "{selectedProduct.component_id}", DESIGNATION "{selectedProduct.additionalInfo?.[0]?.info || 'N/A'}"
                  </p>
                </div>
              )}

              {/* compact images (no border, smaller) */}
              <div className="mb-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

                  <div className="bg-gray-50 rounded flex items-center justify-center">
                    <img
                      src={image3}
                      alt="Image 3"
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
                      <TableHead className="py-1 px-2 whitespace-nowrap">
                        Component ID
                      </TableHead>
                      <TableHead className="py-1 px-2">Product Name</TableHead>
                      <TableHead className="py-1 px-2 text-center whitespace-nowrap">
                        A
                      </TableHead>
                      <TableHead className="py-1 px-2 text-center whitespace-nowrap">
                        L
                      </TableHead>
                      <TableHead className="hidden lg:table-cell py-1 px-2 text-center whitespace-nowrap">
                        L&apos;
                      </TableHead>
                      <TableHead className="hidden lg:table-cell py-1 px-2 text-center whitespace-nowrap">
                        Angle
                      </TableHead>
                      <TableHead className="py-1 px-2 text-center whitespace-nowrap">
                        Qty
                      </TableHead>
                      <TableHead className="py-1 px-2 text-center whitespace-nowrap">
                        Price
                      </TableHead>
                      <TableHead className="py-1 px-2 text-center whitespace-nowrap">
                        Total
                      </TableHead>
                      <TableHead className="py-1 px-2 text-center whitespace-nowrap w-14">
                        Doc
                      </TableHead>
                      <TableHead className="py-1 px-2 text-center whitespace-nowrap w-14">
                        2D
                      </TableHead>
                      <TableHead className="py-1 px-2 text-center whitespace-nowrap w-14">
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
                          {product.additionalInfo?.[0]?.Amini ?? "N/A"}
                        </TableCell>

                        <TableCell className="py-2 px-2 text-center whitespace-nowrap">
                          {product.additionalInfo?.[0]?.L ?? "N/A"}
                        </TableCell>

                        <TableCell className="hidden lg:table-cell py-2 px-2 text-center whitespace-nowrap">
                          {product.additionalInfo?.[0]?.L
                            ? Math.ceil(product.additionalInfo[0].L / 4)
                            : "N/A"}
                        </TableCell>

                        <TableCell className="hidden lg:table-cell py-2 px-2 text-center whitespace-nowrap">
                          {product.additionalInfo?.[0]?.angle ?? "N/A"}
                        </TableCell>

                        <TableCell className="py-2 px-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={quantities[product.id] || ""}
                            onChange={(e) =>
                              handleQuantityChange(product.id, e.target.value)
                            }
                            onBlur={(e) => handleQuantityBlur(product.id, e.target.value)}
                            className="w-full h-7 px-2 text-xs border rounded"
                          />
                        </TableCell>

                        <TableCell className="py-2 px-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={prices[product.id] || ""}
                            onChange={(e) =>
                              handlePriceChange(product.id, e.target.value)
                            }
                            onBlur={(e) => handlePriceBlur(product.id, e.target.value)}
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

        {/* Inactive Account Popup */}
        <Dialog open={inactiveAccountOpen} onOpenChange={setInactiveAccountOpen}>
          <DialogContent className="max-w-md text-center p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-red-600 mb-4">
                Account Not Activated
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                Your account is currently not activated. Please contact us for assistance to activate your account.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-medium">Mobile: +84 978 949 909</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Email: berlivn1@gmail.com</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}