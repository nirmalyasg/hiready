 
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils";
interface StreamingAvatarTextInputProps {
  label: string;
  placeholder: string;
  input: string;
  onSubmit: () => void;
  setInput: (value: string) => void;
  endContent?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

export default function InteractiveAvatarTextInput({
  label,
  placeholder,
  input,
  onSubmit,
  setInput,
  endContent,
  disabled = false,
  loading = false,
}: StreamingAvatarTextInputProps) {
  function handleSubmit() {
    if (input.trim() === "") {
      return;
    }
    onSubmit();
    setInput("");
  }

  return (
  <div className="relative w-full max-w-4xl mx-auto">
    <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm p-4 pr-24">
      <Input
        className="w-full text-gray-800 bg-white pr-24 min-h-[60px]"
        placeholder={placeholder}
        value={input}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            handleSubmit()
          }
        }}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="absolute right-2 bottom-2 flex gap-2 items-center">
        {endContent}
        <Tooltip>
          <TooltipTrigger asChild>
            {loading ? (
              <Loader2 className="h-5 w-5 text-indigo-300 animate-spin" />
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={disabled}
                className={cn(
                  "p-2 rounded-full transition-colors duration-200 shadow-md",
                  input.trim() && !disabled
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                <Send
                  className={cn("h-5 w-5", disabled && "opacity-50")}
                />
              </button>
            )}
          </TooltipTrigger>
          <TooltipContent>Send message</TooltipContent>
        </Tooltip>
      </div>
    </div>
  </div>  );
}