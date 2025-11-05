export default function CTAButton({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold mt-4 hover:bg-blue-700 transition duration-300"
    >
      {text}
    </button>
  )
}
