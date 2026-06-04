import { EditableTableExample } from "@/components/examples/editable-table-example";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
    <div className="w-full">
      <header className="sticky top-0 z-50 w-full bg-background">
        <div className="container-wrapper px-6">
          <div className="h-16 flex items-center justify-between">
            <span className="text-sm font-medium">rzn/ui</span>
            <Button variant="outline" size="icon-lg">
              <ThemeToggle />
            </Button>
          </div>
        </div>
      </header>
      <Tabs defaultValue="EditableTable">
        <div className="px-16 py-4">
          <TabsList className="">
            <TabsTrigger value="EditableTable">Editable Table</TabsTrigger>
            <TabsTrigger value="others">Others</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="EditableTable">
          <div className="w-full px-16">
            <EditableTableExample />
          </div>
        </TabsContent>
        <TabsContent value="others">
          <div className="w-full px-16">Work in Progress</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
