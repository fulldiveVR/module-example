import { useState } from "react";
import deleteIcon from "../../assets/icons/delete-icon.svg";
import { useBackend } from "../../lib";


type Props = {
  _id: string;
  name: string;
  url: string;
  onDeleteItem: (id: string) => void;
};

const Item = ({ _id, name, url, onDeleteItem }: Props) => {
  const [isHovered, setIsHovered] = useState(false);
  const backend = useBackend();

  const handleClick = () => {
    // window.open(url, "_blank");
    backend.openLink(url)
  };



  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 10px",
        borderRadius: "5px",
        fontSize: "14px",
        cursor: "pointer",
        color: "var(--text-color)",
        backgroundColor: isHovered ? "var(--hover-color)" : "transparent",
      }}
      onClick={handleClick}
    >
      {name}
      <button
        style={{
          background: "none",
          border: "none",
          padding: "4px",
          cursor: "pointer",
          display: isHovered ? "flex" : "none",
          alignItems: "center",
          justifyContent: "center"
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDeleteItem(_id);
        }}
      >
        <img
          src={deleteIcon}
          alt="Delete"
          width={16}
          height={16}
        />
      </button>
    </div>
  );
};

export default Item;
