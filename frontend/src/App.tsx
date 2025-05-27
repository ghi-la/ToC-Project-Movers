import React, { DragEvent, useState } from "react";
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
  const [workers, setWorkers] = useState(1);
  const [manualJson, setManualJson] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [showFullScreenAnimation, setShowFullScreenAnimation] = useState(false);
  const [loading, setLoading] = useState(false);
  const gridSizeX = 10;
  const gridSizeY = 5;

  const [SAT_solution, setSAT_solution] = useState(null as string | null);

  const convertToBackendFormat = () => {
    const floorsArray = floors.map((floor) =>
      floor.objects.map((obj) => obj.item.name)
    );

    return {
      items_list: floorsArray,
    };
  };

  React.useEffect(() => {
    setManualJson(JSON.stringify(convertToBackendFormat(), null, 2));
  }, [floors, workers]);

  const handleGenerate = async () => {
    let backendData;

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

    backendData.items_list = [[], ...backendData.items_list];

    setLoading(true);

    try {
      fetch(`http://localhost:8000/runSAT?man=${workers}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendData),
      })
        .then((response: any) => {
          response.text().then((text: string) => {
            setSAT_solution(JSON.parse(text));
          });
          setLoading(false);
        })
        .catch((error: any) => {
          console.error("Error during fetch:", error);
          setLoading(false);
        });
    } catch (error) {
      console.error("Error calling backend:", error);
      setLoading(false);
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

    const rect = e.currentTarget.getBoundingClientRect();
    const cellWidth = rect.width / gridSizeX;
    const cellHeight = rect.height / gridSizeY;

    const cellX = Math.floor((e.clientX - rect.left) / cellWidth);
    const cellY = Math.floor((e.clientY - rect.top) / cellHeight);

    const isItemVertical = draggedItem.isVertical || false;

    const itemWidth = isItemVertical ? 1 : draggedItem.size;
    const itemHeight = isItemVertical ? draggedItem.size : 1;

    if (
      cellX + itemWidth > gridSizeX ||
      cellY + itemHeight > gridSizeY ||
      cellX < 0 ||
      cellY < 0
    ) {
      return;
    }

    const currentObjects = floors.find((f) => f.id === floorId)?.objects || [];

    const hasCollision = currentObjects.some((existingItem) => {
      const existingWidth = existingItem.isVertical
        ? 1
        : existingItem.item.size;
      const existingHeight = existingItem.isVertical
        ? existingItem.item.size
        : 1;

      const overlaps = !(
        cellX >= existingItem.x + existingWidth ||
        cellX + itemWidth <= existingItem.x ||
        cellY >= existingItem.y + existingHeight ||
        cellY + itemHeight <= existingItem.y
      );

      return overlaps;
    });

    if (hasCollision) {
      return;
    }

    const newPlacedItem: ItemPosition = {
      item: draggedItem,
      x: cellX,
      y: cellY,
      isVertical: isItemVertical,
    };

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
          return { ...floor, id: floor.id - 1 };
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

  const AnimatedSolutionVisualization = ({ solution }: { solution: any }) => {
    // Remove all animation state and logic from this component
    if (!solution?.facts) return null;

    return (
      <div className="mt-6 p-4 bg-gray-50 rounded border">
        <h3 className="text-lg font-semibold mb-4">Solution Available</h3>

        <div className="mb-4">
          <div className="text-sm text-gray-700">
            <strong>Status:</strong> {solution.is_satisfiable} in{" "}
            {solution.steps} step(s)
          </div>
        </div>

        {/* Only show the View Full Animation Button */}
        <div className="mb-4">
          <button
            onClick={() => setShowFullScreenAnimation(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
            View Full Animation
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Click the button above to view the animated solution with step-by-step
          worker movements.
        </div>
      </div>
    );
  };

  const FullScreenAnimationPage = () => {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header with back button */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Solution Animation</h1>
          <button
            onClick={() => setShowFullScreenAnimation(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back to Main
          </button>
        </div>

        {/* Full screen animation content */}
        <div className="flex-1 p-6 overflow-auto">
          {SAT_solution?.facts ? (
            <FullScreenAnimationVisualization solution={SAT_solution} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-xl">
                No solution data available
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const FullScreenAnimationVisualization = ({
    solution,
  }: {
    solution: any;
  }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [workerStates, setWorkerStates] = useState<{
      [key: string]: { floor: number; carrying?: string };
    }>({});
    const [buildingState, setBuildingState] = useState<{
      [key: string]: { floor: number; originalFloor: number };
    }>({});

    // Initialize states based on initial floor configuration
    React.useEffect(() => {
      if (!solution?.facts) return;

      // Initialize worker states (all start at floor 0 - ground)
      const initialWorkerStates: {
        [key: string]: { floor: number; carrying?: string };
      } = {};
      for (let i = 0; i < workers; i++) {
        initialWorkerStates[`v_${i}`] = { floor: 0 };
      }

      // Initialize object states based on current floor configuration
      const initialBuildingState: {
        [key: string]: { floor: number; originalFloor: number };
      } = {};
      floors.forEach((floor) => {
        floor.objects.forEach((obj, index) => {
          const objectKey = `${obj.item.name}${index + 1}_floor${floor.id}`;
          initialBuildingState[objectKey] = {
            floor: floor.id,
            originalFloor: floor.id,
          };
        });
      });

      setWorkerStates(initialWorkerStates);
      setBuildingState(initialBuildingState);
      setCurrentStep(0);
    }, [solution, floors, workers]);

    // Apply actions up to current step
    React.useEffect(() => {
      if (!solution?.facts) return;

      const steps = Object.keys(solution.facts)
        .map(Number)
        .sort((a, b) => a - b);

      // Reset to initial states
      const newWorkerStates: {
        [key: string]: { floor: number; carrying?: string };
      } = {};
      for (let i = 0; i < workers; i++) {
        newWorkerStates[`v_${i}`] = { floor: 0 };
      }

      const newBuildingState: {
        [key: string]: { floor: number; originalFloor: number };
      } = {};
      floors.forEach((floor) => {
        floor.objects.forEach((obj, index) => {
          const objectKey = `${obj.item.name}${index + 1}_floor${floor.id}`;
          newBuildingState[objectKey] = {
            floor: floor.id,
            originalFloor: floor.id,
          };
        });
      });

      // Apply all actions up to current step
      for (let i = 0; i <= currentStep && i < steps.length; i++) {
        const stepActions = solution.facts[steps[i]];
        stepActions.forEach((action: any) => {
          const worker = action.worker;

          if (action.action === "goesTo") {
            // Worker moves from one floor to another without carrying anything
            newWorkerStates[worker] = {
              ...newWorkerStates[worker],
              floor: parseInt(action.to_floor),
            };
          } else if (action.action === "pickingUp") {
            // Worker picks up an object - object disappears from floor and worker carries it
            newWorkerStates[worker] = {
              ...newWorkerStates[worker],
              carrying: action.object,
            };
            // Object is no longer visible on any floor (worker has it)
            if (newBuildingState[action.object]) {
              newBuildingState[action.object] = {
                ...newBuildingState[action.object],
                floor: -1, // -1 means object is being carried (not on any floor)
              };
            }
          } else if (action.action === "transports") {
            // Worker moves with an object from current floor to destination floor
            const destinationFloor = parseInt(action.to_floor);
            newWorkerStates[worker] = {
              ...newWorkerStates[worker],
              floor: destinationFloor,
            };

            // Only deploy the object if the worker reaches floor 0 (outside building)
            if (destinationFloor === 0) {
              // Object is deployed outside the building (floor 0)
              if (newBuildingState[action.object]) {
                newBuildingState[action.object] = {
                  ...newBuildingState[action.object],
                  floor: 0, // Object is now outside the building
                };
              }
              // Worker stops carrying the object (it's now deployed outside)
              delete newWorkerStates[worker].carrying;
            }
            // If destination is not floor 0, worker keeps carrying the object
          }
        });
      }

      setWorkerStates(newWorkerStates);
      setBuildingState(newBuildingState);
    }, [currentStep, solution, floors]);

    // Auto-play functionality
    React.useEffect(() => {
      if (!isPlaying || !solution?.facts) return;

      const steps = Object.keys(solution.facts)
        .map(Number)
        .sort((a, b) => a - b);
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000); // 2 seconds per step

      return () => clearInterval(interval);
    }, [isPlaying, solution]);

    if (!solution?.facts) return null;

    const steps = Object.keys(solution.facts)
      .map(Number)
      .sort((a, b) => a - b);
    const currentStepNumber = steps[currentStep] || 0;
    const currentActions = solution.facts[currentStepNumber] || [];

    return (
      <div className="h-full flex flex-col">
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Solution Visualization</h2>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium"
            >
              Previous
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>

            <button
              onClick={() =>
                setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
              }
              disabled={currentStep >= steps.length - 1}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium"
            >
              Next
            </button>

            <span className="text-lg text-gray-600 ml-4">
              Step {currentStep + 1} of {steps.length} (Time:{" "}
              {currentStepNumber})
            </span>
          </div>

          {/* Current Actions Display */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              Current Actions:
            </h3>
            {currentActions.length > 0 ? (
              <ul className="text-blue-700">
                {currentActions.map((action: any, idx: number) => (
                  <li key={idx} className="mb-1">
                    <strong>{action.worker.replace("v_", "Worker ")}</strong>{" "}
                    {action.action === "goesTo"
                      ? `moves from floor ${action.from_floor} to floor ${action.to_floor}`
                      : action.action === "pickingUp"
                      ? `picks up ${action.object
                          .split("_")[0]
                          .replace(/\d+/g, "")} from floor ${
                          action.from_floor || "current floor"
                        }`
                      : action.action === "transports"
                      ? parseInt(action.to_floor) === 0
                        ? `transports ${action.object
                            .split("_")[0]
                            .replace(/\d+/g, "")} from floor ${
                            action.from_floor
                          } to outside building (deploys it)`
                        : `transports ${action.object
                            .split("_")[0]
                            .replace(/\d+/g, "")} from floor ${
                            action.from_floor
                          } to floor ${action.to_floor} (still carrying)`
                      : action.action}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No actions in this step</p>
            )}
          </div>
        </div>

        {/* Large Visualization */}
        <div className="flex-1 flex gap-8">
          {/* Building Visualization - Larger with Workers on Floors */}
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-4">Building State</h3>
            <div className="w-full max-w-2xl mx-auto">
              <div className="flex flex-col-reverse">
                {/* Workers on ground level (outside building) */}
                <div className="h-16 flex items-center justify-center bg-green-200 border-2 border-green-400 mb-2 px-4">
                  <div className="flex gap-4">
                    {Object.entries(workerStates)
                      .filter(
                        ([_, state]) =>
                          (state as { floor: number; carrying?: string })
                            .floor === 0
                      )
                      .map(([workerId, state]) => (
                        <div
                          key={workerId}
                          className="flex flex-col items-center"
                        >
                          <div className="bg-white p-2 rounded-full border-2 border-gray-800 shadow-lg">
                            <WorkerIcon />
                          </div>
                          <span className="text-xs font-bold bg-white px-2 py-1 rounded mt-1">
                            {workerId.replace("v_", "Worker ")}
                          </span>
                          {(state as { floor: number; carrying?: string })
                            .carrying && (
                            <div className="text-xs bg-blue-200 px-2 py-1 rounded mt-1">
                              Carrying:{" "}
                              {(state as { floor: number; carrying?: string })
                                .carrying!.split("_")[0]
                                .replace(/\d+/g, "")}
                            </div>
                          )}
                        </div>
                      ))}
                    {Object.entries(workerStates).filter(
                      ([_, state]) =>
                        (state as { floor: number; carrying?: string })
                          .floor === 0
                    ).length === 0 && (
                      <div className="text-gray-500 italic">
                        No workers on ground level
                      </div>
                    )}
                  </div>

                  {/* Show deployed objects outside the building */}
                  <div className="ml-8 flex flex-wrap gap-2">
                    <div className="text-sm font-semibold text-green-800 mr-2">
                      Deployed Items:
                    </div>
                    {Object.entries(buildingState)
                      .filter(
                        ([_, state]) =>
                          (state as { floor: number; originalFloor: number })
                            .floor === 0
                      )
                      .map(([objectKey, _]) => {
                        const objectName = objectKey
                          .split("_")[0]
                          .replace(/\d+/g, "");
                        const originalItem = items.find(
                          (item) => item.name === objectName
                        );
                        return (
                          <div
                            key={objectKey}
                            className={`${
                              originalItem?.color || "bg-gray-400"
                            } text-xs px-2 py-1 rounded font-medium shadow-lg`}
                            title={`${objectName} - Deployed outside building`}
                          >
                            {objectName}
                          </div>
                        );
                      })}
                    {Object.entries(buildingState).filter(
                      ([_, state]) =>
                        (state as { floor: number; originalFloor: number })
                          .floor === 0
                    ).length === 0 && (
                      <div className="text-gray-500 italic text-xs">
                        No items deployed yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Ground floor (building base) */}
                <div className="h-32 flex items-end justify-center bg-gray-300 border-4 border-gray-700 mb-2 px-4">
                  <div className="h-14 pl-[2px] w-10 bg-orange-800 border-4 border-orange-900 flex flex-row flex-wrap gap-1">
                    <div className="w-[40%] h-[45%] bg-orange-600"></div>
                    <div className="w-[40%] h-[45%] bg-orange-600"></div>
                    <div className="w-[40%] h-[45%] bg-orange-600"></div>
                    <div className="w-[40%] h-[45%] bg-orange-600"></div>
                    <div className="relative top-[-60%] left-[70%] w-2 h-2 rounded-full bg-yellow-200"></div>
                  </div>

                  <div className="text-lg bg-gray-800 text-white px-4 py-2 rounded font-bold">
                    Ground Floor
                  </div>
                </div>

                {/* Building floors with workers */}
                {floors.map((floor) => (
                  <div key={floor.id} className="relative mb-2">
                    <div className="h-4 w-full bg-gray-600"></div>
                    <div className="relative w-full h-32 border-4 border-gray-300 bg-white">
                      {/* Floor label */}
                      <div className="absolute top-2 right-2 text-lg bg-gray-800 text-white px-4 py-2 rounded font-bold">
                        Floor {floor.id}
                      </div>

                      {/* Workers on this floor */}
                      <div className="absolute top-2 left-2 flex gap-2">
                        {Object.entries(workerStates)
                          .filter(
                            ([_, state]) =>
                              (state as { floor: number; carrying?: string })
                                .floor === floor.id
                          )
                          .map(([workerId, state]) => (
                            <div
                              key={workerId}
                              className="flex flex-col items-center"
                            >
                              <div className="bg-white p-1 rounded-full border-2 border-gray-800 shadow-lg">
                                <WorkerIcon />
                              </div>
                              <span className="text-xs font-bold bg-white px-1 rounded">
                                {workerId.replace("v_", "W")}
                              </span>
                              {(state as { floor: number; carrying?: string })
                                .carrying && (
                                <div className="text-xs bg-blue-200 px-1 rounded mt-1">
                                  {(
                                    state as {
                                      floor: number;
                                      carrying?: string;
                                    }
                                  )
                                    .carrying!.split("_")[0]
                                    .replace(/\d+/g, "")}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>

                      {/* Objects on this floor */}
                      <div className="flex flex-wrap gap-2 p-4 pt-16">
                        {Object.entries(buildingState)
                          .filter(
                            ([_, state]) =>
                              (
                                state as {
                                  floor: number;
                                  originalFloor: number;
                                }
                              ).floor === floor.id
                          )
                          .map(([objectKey, _]) => {
                            const objectName = objectKey
                              .split("_")[0]
                              .replace(/\d+/g, "");
                            const originalItem = items.find(
                              (item) => item.name === objectName
                            );
                            return (
                              <div
                                key={objectKey}
                                className={`${
                                  originalItem?.color || "bg-gray-400"
                                } text-lg px-4 py-2 rounded font-medium shadow-lg`}
                                title={objectKey}
                              >
                                {objectName}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Workers Panel - Larger */}
          <div className="w-96">
            <h3 className="text-xl font-semibold mb-4">Workers Status</h3>
            <div className="space-y-4">
              {Object.entries(workerStates).map(([workerId, state]) => (
                <div
                  key={workerId}
                  className="p-6 bg-white border-2 border-gray-200 rounded-lg shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="scale-150">
                      <WorkerIcon />
                    </div>
                    <span className="text-xl font-bold">
                      {workerId.replace("v_", "Worker ")}
                    </span>
                  </div>

                  <div className="text-gray-600">
                    <div className="text-lg mb-2">
                      <strong>Location:</strong>{" "}
                      {(state as { floor: number; carrying?: string }).floor ===
                      0
                        ? "Ground Level (Outside Building)"
                        : `Floor ${
                            (state as { floor: number; carrying?: string })
                              .floor
                          }`}
                    </div>
                    {(state as { floor: number; carrying?: string })
                      .carrying && (
                      <div className="text-blue-600 font-bold text-lg">
                        <strong>Carrying:</strong>{" "}
                        {(state as { floor: number; carrying?: string })
                          .carrying!.split("_")[0]
                          .replace(/\d+/g, "")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Show full screen animation if flag is set
  if (showFullScreenAnimation) {
    return <FullScreenAnimationPage />;
  }

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
                  disabled={workers === 1}
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

            {/* Results area */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              {loading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Solving problem...</p>
                </div>
              ) : SAT_solution ? (
                <>
                  {SAT_solution.facts && (
                    <AnimatedSolutionVisualization solution={SAT_solution} />
                  )}
                </>
              ) : (
                <p className="text-gray-500">No results yet</p>
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
                  disabled={!!jsonError || loading}
                  className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-1 rounded text-sm flex items-center gap-2"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {loading ? "Solving..." : "Solve"}
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
              onChange={(e) => setWorkers(Number(e.target.value) || 1)}
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
