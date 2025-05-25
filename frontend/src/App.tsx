import React, { useState, DragEvent } from "react";
import { twMerge } from "tailwind-merge";

type Item = {
  size: number;
  name: string;
  color: string;
  isVertical?: boolean;
};

type ItemPosition = {
  item: Item;
  x: number;
  y: number;
  isVertical: boolean;
};

type Floor = {
  id: number;
  objects: ItemPosition[];
};

const items: Item[] = [
  {
    size: 3,
    name: "sofa",
    color: "bg-yellow-400 border border-2 border-yellow-500",
    isVertical: false,
  },
  {
    size: 2,
    name: "table",
    color: "bg-blue-500 border border-2 border-blue-600",
    isVertical: false,
  },
  {
    size: 1,
    name: "chair",
    color: "bg-red-500 border border-2 border-red-600",
    isVertical: false,
  },
  {
    size: 1,
    name: "lamp",
    color: "bg-green-500 border border-2 border-green-600",
    isVertical: false,
  },
  {
    size: 2,
    name: "bed",
    color: "bg-purple-500 border border-2 border-purple-600",
    isVertical: false,
  },
  {
    size: 3,
    name: "wardrobe",
    color: "bg-orange-500 border border-2 border-orange-600 text-[1vh]",
    isVertical: true,
  },
  {
    size: 2,
    name: "desk",
    color: "bg-pink-500 border border-2 border-pink-600",
    isVertical: false,
  },
  {
    size: 1,
    name: "bookshelf",
    color: "bg-amber-700 border border-2 border-amber-600 text-[1vh]",
    isVertical: true,
  },
  {
    size: 1,
    name: "tv",
    color: "bg-gray-500 border border-2 border-gray-600",
    isVertical: false,
  },
];

export default function App() {
  const [defaultTab, setDefaultTab] = useState(1);
  const [floors, setFloors] = useState<Floor[]>([{ id: 1, objects: [] }]);
  const [draggedItem, setDraggedItem] = useState(null as Item | null);
  const [hoverCell, setHoverCell] = useState({ x: -1, y: -1, floorId: -1 });
  const [workers, setWorkers] = useState(0);
  const [manualJson, setManualJson] = useState("");
  const [jsonError, setJsonError] = useState("");
  const gridSizeX = 10;
  const gridSizeY = 5;

  // Convert floors data to backend format
  const convertToBackendFormat = () => {
    const floorsArray = floors.map((floor) =>
      floor.objects.map((obj) => obj.item.name)
    );

    return {
      items_list: floorsArray,
    };
  };

  // Initialize manual JSON with current data
  React.useEffect(() => {
    setManualJson(JSON.stringify(convertToBackendFormat(), null, 2));
  }, [floors, workers]);

  // Generate function that will call the backend
  const handleGenerate = async () => {
    let backendData;

    // If we're in JSON tab, use manual JSON, otherwise use converted data
    if (defaultTab === 2) {
      try {
        backendData = JSON.parse(manualJson);
        setJsonError("");
      } catch (error) {
        setJsonError("Invalid JSON format");
        return;
      }
    } else {
      backendData = convertToBackendFormat();
    }

    console.log("Data to send to backend:", backendData);

    try {
      // TODO: Replace with actual backend URL
      // const response = await fetch('/api/generate', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(backendData),
      // });
      // const result = await response.json();
      // console.log('Backend response:', result);

      // For now, just log the data
      alert(
        `Data ready for backend:\nItems List: ${JSON.stringify(
          backendData.items_list,
          null,
          2
        )}\nWorkers: ${workers}`
      );
    } catch (error) {
      console.error("Error calling backend:", error);
    }
  };

  const validateAndUpdateJson = (value: string) => {
    setManualJson(value);

    try {
      const parsed = JSON.parse(value);

      // Validate structure
      if (!parsed.items_list) {
        setJsonError("items_list is required");
        return;
      }

      if (!Array.isArray(parsed.items_list)) {
        setJsonError("items_list must be an array");
        return;
      }

      for (let i = 0; i < parsed.items_list.length; i++) {
        if (!Array.isArray(parsed.items_list[i])) {
          setJsonError(`items_list[${i}] must be an array`);
          return;
        }

        for (let j = 0; j < parsed.items_list[i].length; j++) {
          if (typeof parsed.items_list[i][j] !== "string") {
            setJsonError(`items_list[${i}][${j}] must be a string`);
            return;
          }
        }
      }

      setJsonError("");
    } catch (error) {
      setJsonError("Invalid JSON syntax");
    }
  };

  const resetJsonToCurrentState = () => {
    setManualJson(JSON.stringify(convertToBackendFormat(), null, 2));
    setJsonError("");
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, item: Item) => {
    setDraggedItem(item);
    e.dataTransfer.setData("text/plain", item.name);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, floorId: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Get grid cell dimensions based on container size
    const rect = e.currentTarget.getBoundingClientRect();
    const cellWidth = rect.width / gridSizeX;
    const cellHeight = rect.height / gridSizeY;

    // Calculate which grid cell was dropped on
    const cellX = Math.floor((e.clientX - rect.left) / cellWidth);
    const cellY = Math.floor((e.clientY - rect.top) / cellHeight);

    // Use the item's isVertical property
    const isItemVertical = draggedItem.isVertical || false;

    // Calculate dimensions based on orientation
    const itemWidth = isItemVertical ? 1 : draggedItem.size;
    const itemHeight = isItemVertical ? draggedItem.size : 1;

    // Check if placement would extend beyond grid bounds
    if (
      cellX + itemWidth > gridSizeX ||
      cellY + itemHeight > gridSizeY ||
      cellX < 0 ||
      cellY < 0
    ) {
      console.log("Item would extend beyond grid borders");
      return;
    }

    // Get objects for target floor
    const currentObjects = floors.find((f) => f.id === floorId)?.objects || [];

    // Check for collisions with existing items
    const hasCollision = currentObjects.some((existingItem) => {
      const existingWidth = existingItem.isVertical
        ? 1
        : existingItem.item.size;
      const existingHeight = existingItem.isVertical
        ? existingItem.item.size
        : 1;

      // Check if any part of the item overlaps with existing item
      const overlaps = !(
        cellX >= existingItem.x + existingWidth ||
        cellX + itemWidth <= existingItem.x ||
        cellY >= existingItem.y + existingHeight ||
        cellY + itemHeight <= existingItem.y
      );

      return overlaps;
    });

    if (hasCollision) {
      console.log("Cannot place item here - space already occupied");
      return;
    }

    // If no collision, place the item at the grid cell
    const newPlacedItem: ItemPosition = {
      item: draggedItem,
      x: cellX,
      y: cellY,
      isVertical: isItemVertical,
    };

    // Update the floor objects
    setFloors(
      floors.map((floor) => {
        if (floor.id === floorId) {
          return {
            ...floor,
            objects: [...floor.objects, newPlacedItem],
          };
        }
        return floor;
      })
    );

    setDraggedItem(null);
    setHoverCell({ x: -1, y: -1, floorId: -1 });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, floorId: number) => {
    e.preventDefault();

    if (!draggedItem) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const cellWidth = rect.width / gridSizeX;
    const cellHeight = rect.height / gridSizeY;

    const cellX = Math.floor((e.clientX - rect.left) / cellWidth);
    const cellY = Math.floor((e.clientY - rect.top) / cellHeight);

    setHoverCell({ x: cellX, y: cellY, floorId });
  };

  const handleDragLeave = () => {
    setHoverCell({ x: -1, y: -1, floorId: -1 });
  };

  const addNewFloor = () => {
    const newFloorId = floors.length + 1;
    setFloors([...floors, { id: newFloorId, objects: [] }]);
  };

  const deleteFloor = (floorId: number) => {
    if (floors.length <= 1) {
      console.log("Cannot delete the last floor");
      return;
    }

    setFloors(floors.filter((floor) => floor.id !== floorId));
    setFloors((prevFloors) =>
      prevFloors.map((floor) => {
        if (floor.id > floorId) {
          return { ...floor, id: floor.id - 1 }; // Adjust IDs of remaining floors
        }
        return floor;
      })
    );
  };

  const addWorker = () => {
    setWorkers(workers + 1);
  };

  const removeWorker = () => {
    if (workers > 0) {
      setWorkers(workers - 1);
    }
  };

  const WorkerIcon = () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-600"
    >
      <circle
        cx="12"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );

  return (
    <div className="flex flex-row p-4 min-h-screen">
      {/* Furniture Items Panel */}
      <div className="flex flex-col items-end gap-2 justify-start">
        <div
          onClick={() => setDefaultTab(1)}
          className={twMerge(
            defaultTab === 1 ? "bg-white" : "bg-gray-200",
            "border border-y-1 border-l-1 border-r-0 rounded-l-lg p-4 border-gray-200 cursor-pointer"
          )}
        >
          Manual
        </div>
        <div
          onClick={() => setDefaultTab(2)}
          className={twMerge(
            defaultTab === 2 ? "bg-white" : "bg-gray-200",
            "border border-y-1 border-l-1 border-r-0 rounded-l-lg p-4 border-gray-200 cursor-pointer"
          )}
        >
          JSON
        </div>
      </div>

      {defaultTab === 1 && (
        <>
          <div className="w-full md:w-1/4 p-4 bg-white shadow-md rounded-lg overflow-auto max-h-screen">
            <h2 className="text-xl font-bold mb-4">Furniture Items</h2>
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`${item.color} text-center text-xs flex items-center justify-center shadow-md rounded cursor-move mb-2`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  style={{
                    width: item.isVertical ? 50 : item.size * 50,
                    height: item.isVertical ? item.size * 50 : 50,
                  }}
                >
                  {item.name}
                </div>
              ))}
            </div>

            {/* Workers Section */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Workers</h2>

              {/* Worker Controls */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={removeWorker}
                  disabled={workers === 0}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm"
                >
                  -
                </button>
                <div className="flex items-center flex-row">
                  <label htmlFor="workers" className="mx-2 font-medium">
                    Workers:
                  </label>
                  <input
                    className="rounded-lg bg-gray-200 text-center"
                    type="number"
                    name="workers"
                    id="workers"
                    value={workers}
                    onChange={(e) => setWorkers(Number(e.target.value))}
                    onFocus={(e) => {
                      if (workers === 0) {
                        e.target.select();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={addWorker}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                >
                  +
                </button>
              </div>

              {/* Worker Icons Display */}
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: workers }).map((_, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center p-2 bg-gray-100 rounded border"
                    title={`Worker ${index + 1}`}
                  >
                    <WorkerIcon />
                    <span className="text-xs mt-1">Worker {index + 1}</span>
                  </div>
                ))}
              </div>

              {workers === 0 && (
                <p className="text-gray-500 text-sm italic">
                  No workers assigned
                </p>
              )}
            </div>
          </div>
          {/* Building Visualization Panel */}
          <div className="w-2/3 shadow-md rounded-lg p-4 flex flex-col bg-sky-100">
            <h2 className="text-xl font-bold mb-4">Building</h2>

            <div className="flex-grow overflow-y-auto max-h-[70vh]">
              <div className="min-h-full flex flex-col justify-end">
                <div className="w-[400px] mx-auto">
                  <div className="flex flex-col-reverse">
                    {/* Building Base */}
                    <div className="h-32 flex items-end justify-center bg-gray-300 border-4 border-gray-700 mb-2">
                      <div className="h-14 pl-[2px] w-10 bg-orange-800 border-4 border-orange-900 flex flex-row flex-wrap gap-1">
                        <div className="w-[40%] h-[45%] bg-orange-600"></div>
                        <div className="w-[40%] h-[45%] bg-orange-600"></div>
                        <div className="w-[40%] h-[45%] bg-orange-600"></div>
                        <div className="w-[40%] h-[45%] bg-orange-600"></div>
                        <div className="relative top-[-60%] left-[70%] w-2 h-2 rounded-full bg-yellow-200"></div>
                      </div>
                    </div>

                    {/* Show all floors stacked */}
                    {floors.map((floor) => (
                      <div key={floor.id} className="relative">
                        {/* Floor separator */}
                        <div className="h-3 w-full bg-gray-600"></div>

                        <div
                          className="relative w-full border-2 border-gray-300 bg-white hover:border-blue-400 transition-colors"
                          style={{
                            aspectRatio: `${gridSizeX}/${gridSizeY}`,
                          }}
                          onDrop={(e) => handleDrop(e, floor.id)}
                          onDragOver={(e) => handleDragOver(e, floor.id)}
                          onDragLeave={handleDragLeave}
                        >
                          {/* Floor label and delete button */}
                          <div className="absolute top-1 right-1 flex items-center gap-1 z-40">
                            <div className="px-2 py-1 rounded text-xs bg-gray-800 text-white">
                              Floor {floor.id}
                            </div>
                            {floors.length > 1 && (
                              <button
                                onClick={() => deleteFloor(floor.id)}
                                className="bg-red-500 hover:bg-red-600 text-white rounded text-xs w-6 h-6 flex items-center justify-center"
                                title={`Delete Floor ${floor.id}`}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M10 11v6m4-6v6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>

                          {/* Grid cells (visible on hover or when dragging) */}
                          {draggedItem && hoverCell.floorId === floor.id && (
                            <div className="absolute top-0 left-0 grid grid-cols-10 grid-rows-5 w-full h-full opacity-30 pointer-events-none">
                              {Array.from({
                                length: gridSizeX * gridSizeY,
                              }).map((_, index) => (
                                <div
                                  key={index}
                                  className="border-gray-400 border-[1px]"
                                ></div>
                              ))}
                            </div>
                          )}

                          {/* Preview of item being placed */}
                          {draggedItem &&
                            hoverCell.floorId === floor.id &&
                            hoverCell.x >= 0 &&
                            hoverCell.y >= 0 && (
                              <div
                                className={`${draggedItem.color} opacity-50 text-center flex items-center justify-center text-xs absolute z-20 pointer-events-none`}
                                style={{
                                  width: draggedItem.isVertical
                                    ? `${100 / gridSizeX}%`
                                    : `${
                                        (draggedItem.size * 100) / gridSizeX
                                      }%`,
                                  height: draggedItem.isVertical
                                    ? `${(draggedItem.size * 100) / gridSizeY}%`
                                    : `${100 / gridSizeY}%`,
                                  left: `${(hoverCell.x * 100) / gridSizeX}%`,
                                  top: `${(hoverCell.y * 100) / gridSizeY}%`,
                                }}
                              >
                                {draggedItem.name}
                              </div>
                            )}

                          {/* Placed items for this specific floor */}
                          {floor.objects.map((placedItem, index) => (
                            <div
                              key={index}
                              className={`${placedItem.item.color} text-center flex items-center justify-center text-xs absolute z-10 cursor-pointer`}
                              style={{
                                width: placedItem.isVertical
                                  ? `${100 / gridSizeX}%`
                                  : `${
                                      (placedItem.item.size * 100) / gridSizeX
                                    }%`,
                                height: placedItem.isVertical
                                  ? `${
                                      (placedItem.item.size * 100) / gridSizeY
                                    }%`
                                  : `${100 / gridSizeY}%`,
                                left: `${(placedItem.x * 100) / gridSizeX}%`,
                                top: `${(placedItem.y * 100) / gridSizeY}%`,
                              }}
                              title={`${placedItem.item.name} on Floor ${floor.id}`}
                            >
                              {placedItem.item.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Add Floor Button */}
            <div className="flex flex-col gap-2">
              <button
                className="mt-4 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                onClick={addNewFloor}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Floor
              </button>
              <button
                className="bg-blue-700 hover:bg-blue-800 rounded-xl py-2 text-white"
                onClick={handleGenerate}
              >
                Solve
              </button>
            </div>
          </div>
        </>
      )}

      {defaultTab === 2 && (
        <div className="w-full p-4 bg-white shadow-md rounded-lg flex flex-col">
          <h2 className="text-xl font-bold mb-4">JSON Editor</h2>

          <div className="mb-4 p-4 bg-blue-50 rounded border-l-4 border-blue-500">
            <h3 className="font-semibold text-blue-800 mb-2">
              Expected Format:
            </h3>
            <ul className="text-sm text-blue-700">
              <li>
                • <strong>items_list</strong>: Array of arrays, where each
                sub-array represents a floor
              </li>
              <li>
                • Each floor array contains furniture item names as strings
              </li>
              <li>• An amount of workers greater than 0</li>
            </ul>
          </div>

          {jsonError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              <strong>Error:</strong> {jsonError}
            </div>
          )}

          <div className="flex-grow flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold">JSON:</label>
              <div className="flex gap-2">
                <button
                  onClick={resetJsonToCurrentState}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                >
                  Reset Editor
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!!jsonError}
                  className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-1 rounded text-sm"
                >
                  Solve
                </button>
              </div>
            </div>

            <textarea
              value={manualJson}
              onChange={(e) => validateAndUpdateJson(e.target.value)}
              className={`flex-grow p-4 border rounded-lg font-mono text-sm resize-none ${
                jsonError ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
              placeholder="Enter JSON data here..."
              style={{ minHeight: "400px" }}
            />
          </div>

          <div className="mt-4 flex flex-col w-44">
            <label htmlFor="wrks">Workers:</label>
            <input
              type="number"
              name="wrks"
              id="wrks"
              value={workers}
              onChange={(e) => setWorkers(Number(e.target.value) || 0)}
              placeholder="How many workers?"
              className="bg-gray-100 rounded-lg border border-gray-300 p-2 text-sm"
            />
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Example:</h4>
            <pre className="text-xs text-gray-600">
              {`{
  "items_list": [
    ["sofa", "table", "chair"],
    ["bed", "wardrobe"],
    ["desk", "lamp", "tv"]
  ]
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
