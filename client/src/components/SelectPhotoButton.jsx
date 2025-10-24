import { useRef } from "react";

/**
 * Botón para seleccionar una imagen.
 * Abre el explorador de archivos y llama a onSelect(file)
 */
export default function SelectPhotoButton({ onSelect }) {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file && onSelect) onSelect(file);
  };

  return (
    <div style={styles.wrapper}>
      <button type="button" onClick={handleClick} style={styles.button}>
        Seleccionar foto
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleChange}
      />
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", justifyContent: "center" },
  button: {
    height: 44,
    padding: "0 20px",
    borderRadius: 10,
    background: "#0126B9",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
};
