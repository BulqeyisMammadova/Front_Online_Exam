export default function Spinner({ text = "Yüklənir" }) {
  return (
    <div className="center-load">
      <div className="text-center">
        <div className="spin"></div>
        <p className="text-soft mt-3 mb-0">{text}…</p>
      </div>
    </div>
  );
}
