export const Button = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => {
  return (
    <button
      className=" py-4 px-8 bg-green-500 hover:bg-green-700 text-white font-bold rounded"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
