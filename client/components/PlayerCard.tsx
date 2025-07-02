export default function PlayerCard({ name, onSelect, disabled }: { name: string; onSelect: () => void; disabled?: boolean }) {
    return (
      <button disabled={disabled} className="border rounded p-2 hover:bg-gray-200 w-full" onClick={onSelect}>
        {name}
      </button>
    );
  }