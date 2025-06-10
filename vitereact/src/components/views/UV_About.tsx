import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/main";

// Define interfaces for the About content data
interface ITeamMember {
  name: string;
  bio: string;
  image_url: string;
}

interface IAboutContent {
  history: string;
  mission: string;
  team: ITeamMember[];
  images: string[];
}

// Define static default about content for fallback
const defaultAboutContent: IAboutContent = {
  history: "EstateFinder was founded in 2020 with the mission to simplify property search and bring transparency into the real estate market.",
  mission: "Our mission is to empower property seekers and agents by providing an intuitive and efficient real estate platform.",
  team: [
    {
      name: "Alice Smith",
      bio: "Alice is our visionary founder with over 20 years of experience in real estate.",
      image_url: "https://picsum.photos/seed/alice/200"
    },
    {
      name: "Bob Johnson",
      bio: "Bob leads our tech team ensuring our platform remains innovative and user-friendly.",
      image_url: "https://picsum.photos/seed/bob/200"
    }
  ],
  images: [
    "https://picsum.photos/seed/office/800/400",
    "https://picsum.photos/seed/banner/800/400"
  ]
};

// Define the function to fetch about content from the backend.
// If the GET call fails, return the default static content.
const fetchAboutContent = async (): Promise<IAboutContent> => {
  try {
    const response = await axios.get<IAboutContent>(
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/about`
    );
    return response.data;
  } catch (error) {
    return defaultAboutContent;
  }
};

const UV_About: React.FC = () => {
  // Update global layout state to indicate current view is UV_About
  const { set_global_layout_state } = useAppStore();
  useEffect(() => {
    set_global_layout_state({ current_view: "UV_About", device_type: "desktop" });
  }, [set_global_layout_state]);

  // Use react-query to fetch about content, with fallback to default data
  const { data: aboutContent, isLoading, isError, error } = useQuery<IAboutContent, Error>({
    queryKey: ["aboutContent"],
    queryFn: fetchAboutContent,
    initialData: defaultAboutContent,
  });

  return (
    <>
      {isLoading ? (
        <div className="container mx-auto p-4">
          <p className="text-lg">Loading About content...</p>
        </div>
      ) : isError ? (
        <div className="container mx-auto p-4">
          <p className="text-lg text-red-600">Error loading About content: {error?.message}</p>
        </div>
      ) : (
        <div className="container mx-auto p-4">
          <h1 className="text-4xl font-bold mb-4">About EstateFinder</h1>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">Our History</h2>
            <p className="text-lg">{aboutContent.history}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">Our Mission</h2>
            <p className="text-lg">{aboutContent.mission}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Meet Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aboutContent.team.map((member, index) => (
                <div key={index} className="border rounded p-4 flex flex-col items-center">
                  <img
                    src={member.image_url}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mb-4 object-cover"
                  />
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <p className="text-base text-center">{member.bio}</p>
                </div>
              ))}
            </div>
          </section>

          {aboutContent.images && aboutContent.images.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aboutContent.images.map((imgUrl, index) => (
                  <img
                    key={index}
                    src={imgUrl}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-auto rounded"
                  />
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <Link to="/" className="text-blue-500 underline">
              Return to Home
            </Link>
          </section>
        </div>
      )}
    </>
  );
};

export default UV_About;