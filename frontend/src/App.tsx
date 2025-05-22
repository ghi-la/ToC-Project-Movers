import React, { useState, DragEvent } from "react";

type Floor = {
  id: number;
  objects: ItemPosition[];
};

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
    color: "bg-orange-500 border border-2 border-orange-600",
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
    color: "bg-amber-700 border border-2 border-amber-600",
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
  const [currentFloor, setCurrentFloor] = useState(1);
  const [draggedItem, setDraggedItem] = useState(null as Item | null);
  const [hoverCell, setHoverCell] = useState({ x: -1, y: -1 });
  const gridSizeX = 10;
  const gridSizeY = 5;

  const handleDragStart = (e: DragEvent<HTMLDivElement>, item: Item) => {
    setDraggedItem(item);
    e.dataTransfer.setData("text/plain", item.name);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Get grid cell dimensions
    const cellSize = 50;
    const rect = e.currentTarget.getBoundingClientRect();

    // Calculate which grid cell was dropped on
    const cellX = Math.floor((e.clientX - rect.left) / cellSize);
    const cellY = Math.floor((e.clientY - rect.top) / cellSize);

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

    // Get objects for current floor
    const currentObjects =
      floors.find((f) => f.id === currentFloor)?.objects || [];

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
        if (floor.id === currentFloor) {
          return {
            ...floor,
            objects: [...floor.objects, newPlacedItem],
          };
        }
        return floor;
      })
    );

    setDraggedItem(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!draggedItem) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const cellX = Math.floor((e.clientX - rect.left) / 50);
    const cellY = Math.floor((e.clientY - rect.top) / 50);

    setHoverCell({ x: cellX, y: cellY });
  };

  const handleDragLeave = () => {
    setHoverCell({ x: -1, y: -1 });
  };

  const addNewFloor = () => {
    const newFloorId = floors.length + 1;
    setFloors([...floors, { id: newFloorId, objects: [] }]);
    setCurrentFloor(newFloorId);
  };

  const switchFloor = (floorId: number) => {
    setCurrentFloor(floorId);
  };

  const getCurrentFloorObjects = () => {
    return floors.find((f) => f.id === currentFloor)?.objects || [];
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 min-h-screen">
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

      {/* Floor Grid Panel */}
      <div
        className="w-full md:w-2/4 bg-gray-100 rounded-lg p-4"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Floor {currentFloor}</h2>
        </div>

        <div className="relative w-[500px] h-[250px] border border-gray-300">
          {/* Grid cells */}
          <div className="absolute top-0 left-0 grid grid-cols-10 grid-rows-5 w-full h-full">
            {Array.from({ length: gridSizeX * gridSizeY }).map((_, index) => {
              return (
                <div
                  key={index}
                  className={`border-gray-200 border-[.2em]`}
                ></div>
              );
            })}
          </div>

          {/* Preview of item being placed */}
          {draggedItem && hoverCell.x >= 0 && hoverCell.y >= 0 && (
            <div
              className={`${draggedItem.color} opacity-50 text-center flex items-center justify-center text-xs absolute z-20`}
              style={{
                width: draggedItem.isVertical ? 50 : draggedItem.size * 50,
                height: draggedItem.isVertical ? draggedItem.size * 50 : 50,
                left: hoverCell.x * 50,
                top: hoverCell.y * 50,
              }}
            >
              {draggedItem.name}
            </div>
          )}

          {/* Placed items */}
          {getCurrentFloorObjects().map((placedItem, index) => (
            <div
              key={index}
              className={`${placedItem.item.color} text-center flex items-center justify-center text-xs absolute z-10`}
              style={{
                width: placedItem.isVertical ? 50 : placedItem.item.size * 50,
                height: placedItem.isVertical ? placedItem.item.size * 50 : 50,
                left: placedItem.x * 50,
                top: placedItem.y * 50,
              }}
            >
              {placedItem.item.name}
            </div>
          ))}
        </div>
      </div>

      {/* Building Visualization Panel */}
      <div className="w-full md:w-1/4 bg-white shadow-md rounded-lg p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Building</h2>

        <div className="flex-grow flex flex-col-reverse">
          {floors.map((floor) => (
            <div
              key={floor.id}
              className={`h-16 border-2 border-gray-400 mb-1 flex items-center justify-center cursor-pointer ${
                floor.id === currentFloor
                  ? "bg-blue-100 border-blue-500"
                  : "bg-gray-100"
              }`}
              onClick={() => switchFloor(floor.id)}
            >
              <span className="font-bold">Floor {floor.id}</span>
              <span className="text-xs ml-2">
                ({floor.objects.length} items)
              </span>
            </div>
          ))}

          {/* Building Base */}
          <div className="h-8 bg-gray-800 mb-2"></div>
        </div>

        {/* Add Floor Button */}
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
      </div>
    </div>
  );
}
