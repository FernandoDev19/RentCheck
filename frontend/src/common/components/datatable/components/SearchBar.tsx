import Input from "../../ui/Input";

const SearchIcon = () => (
  <svg
    className="w-4 h-4 text-slate-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
    />
  </svg>
);


type Props = {
  search: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchPlaceholder: string;
};

export default function SearchBar({ search, handleSearch, searchPlaceholder }: Props) {
  return (
    <div className="mb-4 relative max-w-sm flex items-center">
      <span className="absolute left-3 top-1/2 -translate-y-1/2">
        <SearchIcon />
      </span>
      <Input id="search" name="search" className="pl-9 pr-4 py-2" required={false} type="text" value={search} onChange={handleSearch} placeholder={searchPlaceholder}/>
    </div>
  );
}
