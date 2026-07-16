type FormItemProps = {
  children: React.ReactNode;
};

export function FormItem({ children }: FormItemProps) {
  return (
    <div className="space-y-2">
      {children}
    </div>
  );
}