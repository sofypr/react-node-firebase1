// client/src/components/ButtonBlack.jsx
export default function ButtonBlack({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 48,
        borderRadius: 10,
        background: "#000",
        color: "#fff",
        fontSize: 16,
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        transition: "all 0.2s ease",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}
