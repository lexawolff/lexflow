type FormMessageProps = {
  message?: string;
};

export function FormMessage({ message }: FormMessageProps) {
  if (!message) return null;

  return <p className="text-sm text-destructive">{message}</p>;
}