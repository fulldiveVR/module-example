import { useEffect, useState } from "react";
import { itemsApi } from "../../api/items";
import plusIcon from "../../assets/icons/plus-icon.svg";

import Item from "../Item/Item";
import { getLocalizedString } from "../../lib/i18n";

const Panel = () => {
  const [currentItems, setCurrentItems] = useState<Array<{_id: string; name: string; url: string}>>([]);
  const [error, setError] = useState<string | null>(null);

  const onAddClick = () => {
    try {
      itemsApi
        .addItem({
          name: "New Item",
          url: "https://example.com",
        })
        .then((newItem) => {
          setCurrentItems((prevItems) => [...prevItems, newItem]);
        });
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!id) {
        console.error("Cannot delete item with undefined id");
        return;
      }
      await itemsApi.deleteItem(id);
      setCurrentItems(currentItems.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const getItems = async () => {
    try {
      setError(null);
      const data = await itemsApi.getItems();
      setCurrentItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching items:", error);
      setError(getLocalizedString("aiwizeCombinerPanelListError", 'Failed to load items'));
      setCurrentItems([]);
    }
  };

  useEffect(() => {
    getItems();
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        // borderRadius: "0 10px 10px 0",
        border: "1px solid #7b7b7b",
      }}
    >
      <div
        style={{
          display: "flex",
          color: "var(--text-color)",
          fontSize: "16px",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #7b7b7b",
        }}
      >
        {getLocalizedString("aiwizeCombinerPanelTitle", "AI Wize Combiner Panel")}
        <img
          style={{
            cursor: "pointer",
          }}
          src={plusIcon}
          alt="add item"
          width={16}
          height={16}
          onClick={onAddClick}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "8px",
        }}
      >
        {error ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              padding: "24px",
              color: "var(--text-color)"
            }}
          >
            <div>{error}</div>
            <button
              onClick={getItems}
              style={{
                border: "none",
                borderRadius: "4px",
                padding: "8px 16px",
                cursor: "pointer",
                background: "var(--theme-button-background, black)",
                color: "white"
              }}
            >
              {getLocalizedString("aiwizeCombinerPanelRefresh", 'Refresh')}
            </button>
          </div>
        ) : (
          Array.isArray(currentItems) && currentItems.map((item) => 
            item && (
              <Item
                key={item._id}
                _id={item._id}
                name={item.name}
                url={item.url}
                onDeleteItem={handleDelete}
              />
            )
          )
        )}
      </div>
    </div>
  );
};

export default Panel;
