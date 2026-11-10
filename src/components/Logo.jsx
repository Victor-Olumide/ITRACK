export default function Logo({ size = 40, className = '', style = {} }) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      className={`inline-block shrink-0 rounded-lg align-middle object-contain ${className}`}
      style={{ width: size, height: size, ...style }}
      aria-hidden="true"
    />
  )
}
