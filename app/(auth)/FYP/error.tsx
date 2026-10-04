"use client";



export default function Error({ error, reset }: { error: Error; reset: () => void }) {

  return (

    <div className="p-10 text-white">

      <h2>An error has occurred!</h2>

      <button onClick={() => reset()}>Try again.</button>

    </div>

  );

}