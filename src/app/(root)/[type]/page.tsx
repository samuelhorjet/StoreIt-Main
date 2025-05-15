import Cardb from "@/Component/sections/Cardb";
import Sort from "@/Component/sections/Sort";
import Total from "@/Component/sections/total";
import { getFiles } from "@/lib/actions/file.actions";
import { getFileTypesParams } from "@/lib/utils";
import type { Models } from "node-appwrite";

interface SearchParamProps {
  params: {
    type?: string;
  };
  searchParams: {
    query?: string;
    sort?: string;
  };
}
const Page = async ({ searchParams, params }: SearchParamProps) => {
  // Ensure params and searchParams are awaited before accessing them
  const type = (await params?.type) || "";
  const searchText = (await searchParams?.query) || "";
  const sort = (await searchParams?.sort) || "";

  // Continue with the rest of your logic
  const types = getFileTypesParams(type) as FileType[];

  const files = await getFiles({ types, searchText, sort });

     return (
       <div className="page-container">
         <section className="w-full mb-6">
           <h1 className="h1 capitalize">{type}</h1>
           <div className="total-size-section">
             <Total files={files.documents} />
             <div className="sort-container">
               <p className="body-1 hidden sm:block text-light-200">Sort by:</p>
               <Sort />
             </div>
           </div>
         </section>

         {files?.documents?.length > 0 ? (
           <section className="flex flex-wrap justify-center gap-4 items-start w-full min-h-[180px] overflow-y-auto custom-scrollbar">
             {files.documents.map((file: Models.Document) => (
               <Cardb key={file.$id} file={file} />
             ))}
           </section>
         ) : (
           <div className="empty-list">
             <p>No files Uploaded</p>
           </div>
         )}
       </div>
     );
};

export default Page;
