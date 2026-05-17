import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SlittingEntryForm from "./SlittingEntryForm";
import MaterialReturn from "./MaterialReturn";
import Head36Entry from "./Head36Entry";

export default function SlittingEntry() {
  return (
    <Tabs defaultValue="slitting" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="slitting">Slitting Entry</TabsTrigger>
        <TabsTrigger value="return">Material Return</TabsTrigger>
        <TabsTrigger value="head36">36 Head Production</TabsTrigger>
      </TabsList>
      <TabsContent value="slitting"><SlittingEntryForm /></TabsContent>
      <TabsContent value="return"><MaterialReturn /></TabsContent>
      <TabsContent value="head36"><Head36Entry /></TabsContent>
    </Tabs>
  );
}
