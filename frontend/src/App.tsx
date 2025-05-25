import React, { useState, DragEvent } from "react";

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
  const [floors, setFloors] = useState([{ id: 1, objects: [] }]);
  const [draggedItem, setDraggedItem] = useState(null as Item | null);
  const [hoverCell, setHoverCell] = useState({ x: -1, y: -1, floorId: -1 });
  const gridSizeX = 10;
  const gridSizeY = 5;

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

  return (
    <div className="flex flex-row gap-4 p-4 min-h-screen">
      {/* Furniture Items Panel */}
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
                      {/* Floor label */}
                      <div className="absolute top-1 right-1 px-2 py-1 rounded text-xs z-40 bg-gray-800 text-white">
                        Floor {floor.id}
                      </div>

                      {/* Grid cells (visible on hover or when dragging) */}
                      {draggedItem && hoverCell.floorId === floor.id && (
                        <div className="absolute top-0 left-0 grid grid-cols-10 grid-rows-5 w-full h-full opacity-30 pointer-events-none">
                          {Array.from({ length: gridSizeX * gridSizeY }).map(
                            (_, index) => (
                              <div
                                key={index}
                                className="border-gray-400 border-[1px]"
                              ></div>
                            )
                          )}
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
                                : `${(draggedItem.size * 100) / gridSizeX}%`,
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
                              : `${(placedItem.item.size * 100) / gridSizeX}%`,
                            height: placedItem.isVertical
                              ? `${(placedItem.item.size * 100) / gridSizeY}%`
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
        {/* grass */}
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
          <button className="bg-blue-700 hover:bg-blue-800 rounded-xl py-2 text-white">
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
