import axios from "axios";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { incrementUserSearch, getUser } from "@/api/api";
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

export default function BusbarCalculator({ onSearchComplete, currentUser, isCurrentAdmin }: BusbarCalculatorProps) {
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
  const [distanceBetweenFixingPoints, setDistanceBetweenFixingPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnlyWithImg1, setShowOnlyWithImg1] = useState(false);
  const itemsPerPage = 10;
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState("12");

  useEffect(() => {
    const fetchUserLimit = async () => {
      if (user?.id && !isAdmin) {
        const res = await getUser(user.id);
        if (res.ok && res.data) {
          const limit = res.data.daily_search_limit || 20;
          const count = res.data.search_count || 0;
          const remaining = Math.max(0, limit - count);
          setRemainingSearches(remaining);
          setCanSearch(remaining > 0);
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

  const filteredProducts = showOnlyWithImg1
    ? products.filter((product) => !product.additionalInfo?.[0]?.img1Article)
    : products;

  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleIccChange = (value: string) => {
    const cleanedValue = value.replace(/^0+/, "").replace(/[^\d.]/g, "") || "0";
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
        options = ["12", "15", "20", "25", "30", "32", "40", "50", "60", "63", "80", "100", "125", "150"];
        break;
      case "10":
        options = ["10", "20", "30", "40", "50", "60", "80", "100", "120", "150", "160", "200"];
        break;
      default:
        options = [];
    }
    setWidthOptions(options);
    setWidth(options[0] || "");
  };

  const fetchProducts = async () => {
    if (!isAdmin && !canSearch) {
      alert(`Bạn đã hết lượt tra cứu hôm nay. Còn lại: ${remainingSearches} lượt`);
      return;
    }

    setLoading(true);
    try {
      if (!isAdmin && user?.id) {
        const res = await incrementUserSearch(user.id);
        if (res.ok && res.data) {
          setRemainingSearches(res.data.remaining);
          setCanSearch(res.data.allowed);
          if (onSearchComplete) onSearchComplete();
          if (!res.data.allowed) {
             alert("Bạn đã hết lượt tra cứu trong ngày.");
             setLoading(false);
             return;
          }
        }
      }

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

      const response = await axios.post("http://127.0.0.1:8000/api/queryBusbar", {
        perPhase,
        thickness,
        width,
        poles,
        shape,
        icc,
      });
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

  const handleRowClick = async (product: any) => {
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
          return;
        } catch (error) {
          continue;
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
      return '#';
    }
    const componentId = product.component_id;
    const resmini = product.additionalInfo[0].resmini * 10;
    const nbphase = product.additionalInfo[0].nbphase;
    const suffix = docType === 'doc' ? 'doc' : docType === '2d' ? '2d' : '3d';
    const extension = docType === '3d' ? 'stp' : 'pdf';
    const filePath = `/documents/${componentId}-${resmini}-${nbphase}-${suffix}.${extension}`;
    return `http://127.0.0.1:8000/api/getFile?path=${encodeURIComponent(filePath)}`;
  };

  return (
    <div className="grid grid-cols-[300px_1fr] gap-6">
      <div className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-fit">
        <h2 className="text-xl font-bold text-red-600 mb-2">Busbar Support</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Per Phase</label>
            <Select value={perPhase} onValueChange={setPerPhase}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Per Phase" />
              </SelectTrigger>
              <SelectContent>
                {["1 Busbar", "2 Busbar", "3 Busbar", "4 Busbar", "5 Busbar"].map((val) => (
                  <SelectItem key={val} value={val}>{val}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Thickness</label>
              <Select value={thickness} onValueChange={handleThicknessChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["2", "4", "5", "10"].map((val) => (
                    <SelectItem key={val} value={val}>{val}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Width</label>
              <Select value={width} onValueChange={setWidth} disabled={widthOptions.length === 0}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {widthOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Poles</label>
            <div className="flex gap-2">
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Shape</label>
            <div className="grid grid-cols-4 gap-2">
              {["C", "P", "I", "E"].map((s) => (
                <label key={s} className="flex flex-col items-center cursor-pointer border rounded p-2 hover:bg-gray-50">
                  <div className="text-2xl font-bold text-gray-400 mb-1">{s}</div>
                  <input
                    type="radio"
                    name="shape"
                    value={s}
                    checked={shape === s}
                    onChange={(e) => setShape(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Icc3 (kA effective)</label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleIccChange(e.target.value)}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ipk (kA peak)</label>
            <input
              type="number"
              value={ipk.toFixed(2)}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Space between phases (A)</label>
            <Select
              value={spaceBetweenPhases.toString()}
              onValueChange={(value) => setSpaceBetweenPhases(Number(value))}
            >
              <SelectTrigger>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Distance between fixing points (B)</label>
            <input
              type="number"
              value={distanceBetweenFixingPoints}
              onChange={(e) => setDistanceBetweenFixingPoints(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!isAdmin && (
            <Alert>
              <AlertDescription className="text-sm">
                Số lượt tra cứu còn lại hôm nay: <strong>{remainingSearches}</strong>
              </AlertDescription>
            </Alert>
          )}

          <button
            onClick={fetchProducts}
            disabled={loading || (!isAdmin && !canSearch)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              "Search Products"
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-lg">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-blue-500 mt-4">Loading product information...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">
                N° {selectedProduct?.component_id || "No Product Selected"}
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                Designation: {selectedProduct?.additionalInfo?.[0]?.info || "No Product Selected"}
              </p>
              <hr className="mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Data and Calculations in accordance with IEC 61 439
              </p>

              <div className="flex gap-4 mb-6">
                <img src={image1} alt="Image 1" className="w-64 h-48 object-contain border rounded" />
                <img src={image2} alt="Image 2" className="w-64 h-48 object-contain border rounded" />
                <img src={image3} alt="Image 3" className="w-64 h-48 object-contain border rounded" />
              </div>

              <BusbarCanvas
                leftValue={
                  selectedProduct?.additionalInfo?.[0]?.L
                    ? Math.ceil(selectedProduct.additionalInfo[0].L / 4).toString()
                    : "N/A"
                }
                centerValue={selectedProduct?.additionalInfo?.[0]?.L?.toString() || "N/A"}
              />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              {filteredProducts.length > 0 ? (
                <>
                  <div className="mb-4">
                    <button
                      onClick={() => setShowOnlyWithImg1(!showOnlyWithImg1)}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                    >
                      {showOnlyWithImg1 ? "Show All Products" : "Show BERLIVN Products"}
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
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
                          <TableHead>Doc</TableHead>
                          <TableHead>2D</TableHead>
                          <TableHead>3D</TableHead>
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
                            <TableCell>{product.component_id}</TableCell>
                            <TableCell>{product.additionalInfo?.[0]?.info || "N/A"}</TableCell>
                            <TableCell>{product.additionalInfo?.[0]?.Amini || "N/A"}</TableCell>
                            <TableCell>{product.additionalInfo?.[0]?.L || "N/A"}</TableCell>
                            <TableCell>
                              {product.additionalInfo?.[0]?.L
                                ? Math.ceil(product.additionalInfo[0].L / 4)
                                : "N/A"}
                            </TableCell>
                            <TableCell>{product.additionalInfo?.[0]?.angle || "N/A"}</TableCell>
                            <TableCell>
                              <input
                                type="number"
                                value={quantities[product.id] || ""}
                                onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                className="w-20 px-2 py-1 border rounded"
                              />
                            </TableCell>
                            <TableCell>
                              <input
                                type="number"
                                value={prices[product.id] || ""}
                                onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                className="w-20 px-2 py-1 border rounded"
                              />
                            </TableCell>
                            <TableCell>{calculateTotal(product.id)}</TableCell>
                            <TableCell>
                              <a href={generateFileLink(product, 'doc')} className="text-blue-600 hover:underline">
                                Download
                              </a>
                            </TableCell>
                            <TableCell>
                              <a href={generateFileLink(product, '2d')} className="text-blue-600 hover:underline">
                                Download
                              </a>
                            </TableCell>
                            <TableCell>
                              <a href={generateFileLink(product, '3d')} className="text-blue-600 hover:underline">
                                Download
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-center items-center mt-4 gap-2">
                    {Array.from({ length: totalPages }, (_, index) => (
                      <button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-3 py-1 rounded ${
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
              ) : (
                <p className="text-center text-lg text-gray-500">No products found.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
