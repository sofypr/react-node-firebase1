// client/src/components/ButtonOutline.jsx
export default function ButtonOutline({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 48,
        borderRadius: 10,
        background: "#fff",
        color: "#000",
        fontSize: 16,
        fontWeight: 600,
        border: "2px solid #000",
        cursor: "pointer",
        transition: "all 0.2s ease",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}
