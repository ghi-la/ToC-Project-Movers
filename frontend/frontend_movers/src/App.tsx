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
  { size: 3, name: "sofa", color: "bg-yellow-400", isVertical: false },
  { size: 2, name: "table", color: "bg-blue-500", isVertical: false },
  { size: 1, name: "chair", color: "bg-red-500", isVertical: false },
  { size: 1, name: "lamp", color: "bg-green-500", isVertical: false },
  { size: 2, name: "bed", color: "bg-purple-500", isVertical: false },
  { size: 3, name: "wardrobe", color: "bg-orange-500", isVertical: true },
  { size: 2, name: "desk", color: "bg-pink-500", isVertical: false },
  { size: 1, name: "bookshelf", color: "bg-amber-700", isVertical: true },
  { size: 1, name: "tv", color: "bg-gray-500", isVertical: false },
];

export default function App() {
  const [placedItems, setPlacedItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null as Item | null);
  const [isVertical, setIsVertical] = useState(false);
  const gridSize = 10;

  const handleDragStart = (e: DragEvent<HTMLDivElement>, item: Item) => {
    setDraggedItem(item);
    e.dataTransfer.setData("text/plain", item.name);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedItem) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 50);
    const y = Math.floor((e.clientY - rect.top) / 50);

    // Check if within grid bounds
    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return;

    // Calculate the size of the item based on orientation
    const itemWidth = isVertical ? 1 : draggedItem.size;
    const itemHeight = isVertical ? draggedItem.size : 1;

    // Check if item would extend beyond grid
    if (x + itemWidth > gridSize || y + itemHeight > gridSize) {
      console.log("Item would extend beyond grid borders");
      return;
    }

    // Check for collisions with existing items
    const hasCollision = placedItems.some((existingItem) => {
      const existingWidth = existingItem.isVertical
        ? 1
        : existingItem.item.size;
      const existingHeight = existingItem.isVertical
        ? existingItem.item.size
        : 1;

      // Check if rectangles overlap
      const overlapX = !(
        x + itemWidth <= existingItem.x || existingItem.x + existingWidth <= x
      );

      const overlapY = !(
        y + itemHeight <= existingItem.y || existingItem.y + existingHeight <= y
      );

      return overlapX && overlapY;
    });

    if (hasCollision) {
      console.log("Cannot place item here - space already occupied");
      return;
    }

    // If no collision, place the item
    const newPlacedItem: ItemPosition = {
      item: draggedItem,
      x,
      y,
      isVertical,
    };

    setPlacedItems([...placedItems, newPlacedItem]);
    setDraggedItem(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const toggleOrientation = () => {
    setIsVertical(!isVertical);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 min-h-screen">
      <div className="w-full md:w-1/3 p-4 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-bold mb-4">Furniture Items</h2>
        <button
          onClick={toggleOrientation}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          {isVertical ? "Switch to Horizontal" : "Switch to Vertical"}
        </button>
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <div
              key={index}
              className={`${item.color} text-center text-sm flex items-center justify-center shadow-md rounded cursor-move`}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              style={{
                width: isVertical ? 50 : item.size * 50,
                height: isVertical ? item.size * 50 : 50,
              }}
            >
              {item.name}
            </div>
          ))}
        </div>
      </div>

      <div
        className="w-full md:w-2/3 bg-gray-100 rounded-lg p-4"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="relative w-[500px] h-[500px] grid grid-cols-10 grid-rows-10 gap-0 border border-gray-300">
          {Array.from({ length: gridSize * gridSize }).map((_, index) => (
            <div
              key={index}
              className="border border-gray-200 w-[50px] h-[50px]"
            ></div>
          ))}

          {placedItems.map((placedItem, index) => (
            <div
              key={index}
              className={`${placedItem.item.color} text-center flex items-center justify-center text-sm absolute z-10`}
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
    </div>
  );
}
