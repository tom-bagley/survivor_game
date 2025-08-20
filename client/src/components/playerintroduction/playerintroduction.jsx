export default function Introduction({
  name,
  profilePhotoUrl,
  age,
  Hometown,
  Current_Residence,
  Occupation,
  homepage
}) {
  // Twice as big if homepage
  const imageClasses = homepage
    ? "w-100 h-auto rounded-2xl object-cover" // 2x bigger image
    : "w-32 h-auto rounded-lg object-cover"; // default size

  const nameClasses = homepage
    ? "text-3xl font-bold" // much larger title
    : "text-xl font-bold";

  const containerClasses = homepage
    ? "flex gap-8 items-start bg-black/30 p-14 rounded-3xl ring-4 ring-white/30"
    : "flex gap-4 items-start bg-black/30 p-4 rounded-xl ring-1 ring-white/10";

  const textClasses = homepage
    ? "text-2xl space-y-2" // bigger, more spaced-out text
    : "";

  return (
    <div className={containerClasses}>
      <div className="flex-shrink-0">
        <img src={profilePhotoUrl} alt="Profile" className={imageClasses} />
      </div>
      <div className={`text-white ${textClasses}`}>
        <h4 className={nameClasses}>{name}</h4>
        <p>Age: {age}</p>
        <p>Hometown: {Hometown}</p>
        <p>Current Residence: {Current_Residence}</p>
        <p>Occupation: {Occupation}</p>
      </div>
    </div>
  );
}

