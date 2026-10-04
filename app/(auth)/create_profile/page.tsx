"use client";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfileAction } from "@/actions/profile";



export default function CreateProfilePage() {
const router = useRouter();

const [bio, setBio] = useState("");
const [selectedHobbies, setSelectedHobbies] =
useState<string[]>([]);
const [customHobby, setCustomHobby] = useState("");

const [selectedValues, setSelectedValues] =
useState<string[]>([]);
const [customValue, setCustomValue] = useState("");

const [selectedFaults, setSelectedFaults] =
useState<string[]>([]);
const [customFault, setCustomFault] = useState("");

const [isSmoker, setIsSmoker] = useState<boolean>(false);

const [icebreakers, setIcebreakers] =
useState<string[]>([]);
const [customIcebreaker, setCustomIcebreaker] =
useState("");

const [loading, setLoading] = useState(false);

const addHobby = (e: React.FormEvent) => {
e.preventDefault();


const value = customHobby.trim();

if (
  !value ||
  selectedHobbies.includes(value)
) {
  return;
}

setSelectedHobbies([
  ...selectedHobbies,
  value,
]);

setCustomHobby("");


};

const removeHobby = (index: number) => {
setSelectedHobbies(
selectedHobbies.filter(
(_, i) => i !== index
)
);
};

const addValue = (e: React.FormEvent) => {
e.preventDefault();


const value = customValue.trim();

if (
  !value ||
  selectedValues.includes(value)
) {
  return;
}

setSelectedValues([
  ...selectedValues,
  value,
]);

setCustomValue("");


};

const removeValue = (index: number) => {
setSelectedValues(
selectedValues.filter(
(_, i) => i !== index
)
);
};

const addFault = (e: React.FormEvent) => {
e.preventDefault();


const value = customFault.trim();

if (
  !value ||
  selectedFaults.includes(value)
) {
  return;
}

setSelectedFaults([
  ...selectedFaults,
  value,
]);

setCustomFault("");


};

const removeFault = (index: number) => {
setSelectedFaults(
selectedFaults.filter(
(_, i) => i !== index
)
);
};

const addIcebreaker = (e: React.FormEvent) => {
e.preventDefault();


const value = customIcebreaker.trim();

if (!value) {
  return;
}

setIcebreakers([
  ...icebreakers,
  value,
]);

setCustomIcebreaker("");


};

const removeIcebreaker = (index: number) => {
setIcebreakers(
icebreakers.filter(
(_, i) => i !== index
)
);
};




const handleSubmit = async (
e: React.FormEvent
) => {
e.preventDefault();


setLoading(true);

const formData = new FormData();





formData.append("bio", bio);

formData.append(
  "hobbies",
  JSON.stringify(selectedHobbies)
);

formData.append(
  "values",
  JSON.stringify(selectedValues)
);

formData.append(
  "faults",
  JSON.stringify(selectedFaults)
);

formData.append(
  "isSmoker",
  String(isSmoker)
);

formData.append(
  "icebreakers",
  JSON.stringify(icebreakers)
);

try {
  // saveProfileAction now reads pendingToken
  // directly from the cookie.
  const result =
    await saveProfileAction(formData);

  if (result.success) {
    router.push("/FYP");
  } else {
    alert(
      result.error ||
        "Error while saving to the database!"
    );

    setLoading(false);
  }
} catch (err) {
  console.error(err);

  alert(
    "A server error occurred."
  );

  setLoading(false);
}


};

return ( <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center py-12 px-4"> <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-xl border border-slate-800"> <h1 className="text-3xl font-bold text-pink-500 mb-8 text-center">
Create Profile </h1>


    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* PHOTOS */}
     

      {/* BIO */}
      <textarea
        value={bio}
        onChange={(e) =>
          setBio(e.target.value)
        }
        placeholder="Tell us about yourself..."
        maxLength={150}
        className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-pink-500 outline-none text-sm text-white"
      />

      {/* LIFESTYLE */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-300">
          Lifestyle
        </label>

        <button
          type="button"
          onClick={() =>
            setIsSmoker(!isSmoker)
          }
          className="w-full p-3 rounded-lg border border-slate-700 bg-slate-800 hover:border-slate-500 transition"
        >
          {isSmoker
            ? "🚬 Smoker"
            : "🚫 Non-smoker"}
        </button>
      </div>

      {/* INTERESTS */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-300">
          Interests
        </label>

        <div className="flex flex-wrap gap-2 mb-2">
          {selectedHobbies.map(
            (h, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-pink-600/30 rounded-full text-xs flex items-center gap-2 border border-pink-500"
              >
                {h}

                <button
                  type="button"
                  onClick={() =>
                    removeHobby(i)
                  }
                  className="text-pink-200"
                >
                  ×
                </button>
              </span>
            )
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={customHobby}
            onChange={(e) =>
              setCustomHobby(
                e.target.value
              )
            }
            placeholder="E.g. Gaming"
            className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm"
          />

          <button
            type="button"
            onClick={addHobby}
            className="px-4 bg-pink-600 rounded-lg font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* VALUES */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-300">
          My Values
        </label>

        <div className="flex flex-wrap gap-2 mb-2">
          {selectedValues.map(
            (val, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-pink-600/30 rounded-full text-xs flex items-center gap-2 border border-pink-500"
              >
                {val}

                <button
                  type="button"
                  onClick={() =>
                    removeValue(i)
                  }
                  className="text-pink-200"
                >
                  ×
                </button>
              </span>
            )
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={customValue}
            onChange={(e) =>
              setCustomValue(
                e.target.value
              )
            }
            placeholder="E.g. Honesty"
            className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm"
          />

          <button
            type="button"
            onClick={addValue}
            className="px-4 bg-pink-600 rounded-lg font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* FAULTS */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-300">
          My Faults
        </label>

        <div className="flex flex-wrap gap-2 mb-2">
          {selectedFaults.map(
            (f, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-pink-600/30 rounded-full text-xs flex items-center gap-2 border border-pink-500"
              >
                {f}

                <button
                  type="button"
                  onClick={() =>
                    removeFault(i)
                  }
                  className="text-pink-200"
                >
                  ×
                </button>
              </span>
            )
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={customFault}
            onChange={(e) =>
              setCustomFault(
                e.target.value
              )
            }
            placeholder="E.g. Stubborn"
            className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm"
          />

          <button
            type="button"
            onClick={addFault}
            className="px-4 bg-pink-600 rounded-lg font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* ICEBREAKERS */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-300">
          Icebreakers
        </label>

        {icebreakers.map(
          (text, i) => (
            <div
              key={i}
              className="bg-slate-800 p-3 rounded-lg border-l-4 border-pink-500 text-xs flex justify-between"
            >
              {`"${text}"`}

              <button
                type="button"
                onClick={() =>
                  removeIcebreaker(i)
                }
                className="text-red-400 ml-2"
              >
                ×
              </button>
            </div>
          )
        )}

        <div className="flex gap-2">
          <input
            value={customIcebreaker}
            onChange={(e) =>
              setCustomIcebreaker(
                e.target.value
              )
            }
            placeholder="Write something..."
            className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm"
          />

          <button
            type="button"
            onClick={addIcebreaker}
            className="px-4 bg-pink-600 rounded-lg font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-pink-600 font-bold rounded-xl hover:bg-pink-700 transition"
      >
        {loading
          ? "Saving..."
          : "Finish Profile"}
      </button>

      <Link
        href="/login"
        className="block text-center text-slate-400 hover:text-pink-500 text-sm"
      >
        ← Back to Login
      </Link>
    </form>
  </div>
</div>

);
}