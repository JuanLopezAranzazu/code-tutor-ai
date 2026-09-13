import * as Progress from "@radix-ui/react-progress";

export default function ProgressBar({ value }: { value: number }) {
  return (
    <Progress.Root
      className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800 transform-gpu"
      value={value}
    >
      <Progress.Indicator
        className="h-full w-full bg-slate-400 transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </Progress.Root>
  );
}
