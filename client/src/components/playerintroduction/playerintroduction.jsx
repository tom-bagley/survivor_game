export default function Introduction({
  name,
  profilePhotoUrl,
  age,
  Hometown,
  Current_Residence,
  Occupation,
  Link,
  homepage,
}) {
  const imageClasses = homepage
    ? "w-32 md:w-50 h-auto rounded-lg object-cover" 
    : "w-32 h-auto rounded-lg object-cover"; 

  const nameClasses = homepage
    ? "text-xl font-bold" 
    : "text-xl font-bold";

  const containerClasses = homepage
    ? "flex gap-4 items-start bg-black/30 p-4 rounded-xl ring-1 ring-white/10 max-w-lg mx-auto"
    : "flex gap-4 items-start bg-black/30 p-4 rounded-xl ring-1 ring-white/10";

  const textClasses = homepage
    ? "" 
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
      {!homepage && (
        <p>
          <a
            href={Link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline hover:text-blue-300"
          >
            Interview
          </a>
        </p>
      )}
    </div>
  </div>
);

}

