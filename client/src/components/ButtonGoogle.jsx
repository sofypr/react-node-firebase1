// client/src/components/ButtonGoogle.jsx
import googleLogo from "../assets/logoGoogle.png";

export default function ButtonGoogle({ text = "Continuar con Google", onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 48,
        borderRadius: 10,
        background: "#fff",
        color: "#3c4043",
        fontSize: 14,
        fontWeight: 500,
        border: "1px solid #dadce0",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        transition: "all 0.2s ease",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <img src={googleLogo} alt="Google" style={{ width: 20, height: 20 }} />
      {text}
    </button>
  );
}
