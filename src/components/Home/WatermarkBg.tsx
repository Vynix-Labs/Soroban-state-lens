const WatermarkBg = () => {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white watermark-pulse pointer-events-none z-0">
      <svg
        className="opacity-100"
        fill="none"
        height="400"
        viewBox="0 0 48 48"
        width="400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M24 4L6 14V34L24 44L42 34V14L24 4Z"
          fill="none"
          stroke="currentColor"
          stroke-width="0.5"
        ></path>
        <path
          d="M24 10L10 18V30L24 38L38 30V18L24 10Z"
          fill="none"
          stroke="currentColor"
          stroke-width="0.5"
        ></path>
        <path
          className="text-primary"
          d="M24 16L16 20.5V27.5L24 32L32 27.5V20.5L24 16Z"
          fill="currentColor"
        ></path>
      </svg>
    </div>
  )
}

export default WatermarkBg
