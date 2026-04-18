const VersionFooter = () => {
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";
  const commit = typeof __APP_COMMIT__ !== "undefined" ? __APP_COMMIT__ : "local";

  return (
    <div className="w-full text-center py-2 text-[10px] text-gray-400 select-none">
      v{version} · {commit}
    </div>
  );
};

export default VersionFooter;
