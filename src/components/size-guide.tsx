import * as React from "react";
import { Info, Ruler } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SHIRT_SIZES = [
  { age: "6-12m", length: "13", shoulder: "8.5", chest: "10.5" },
  { age: "1-2y", length: "14", shoulder: "9.5", chest: "11" },
  { age: "2-3y", length: "15", shoulder: "10", chest: "11.5" },
  { age: "3-4y", length: "16", shoulder: "10.5", chest: "12" },
  { age: "4-5y", length: "16.5", shoulder: "10.5", chest: "12.5" },
  { age: "5-6y", length: "18.5", shoulder: "11.5", chest: "13.5" },
];

const TROUSER_SIZES = [
  { size: "1-2", length: '9.5"', waist: '7"' },
  { size: "2-3", length: '10.5"', waist: '9"' },
  { size: "3-4", length: '11"', waist: '10"' },
  { size: "4-5", length: '12"', waist: '10.5"' },
];

const DHOTI_SIZES = [
  { age: "6-12", length: "17" },
  { age: "1-2", length: "18" },
  { age: "2-3", length: "20" },
  { age: "3-4", length: "22" },
  { age: "4-5", length: "24" },
];

interface SizeGuideProps {
  children: React.ReactNode;
}

export function SizeGuide({ children }: SizeGuideProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md bg-cream border-border/50 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-cocoa">
            <Ruler className="h-6 w-6 text-primary" /> Size Guide
          </DialogTitle>
          <DialogDescription className="text-cocoa/70">
            Find the perfect fit for your little one. All measurements are in inches.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="shirts" className="mt-4 w-full">
          <TabsList className="grid w-full grid-cols-3 bg-sand p-1">
            <TabsTrigger 
              value="shirts" 
              className="rounded-lg font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Shirts
            </TabsTrigger>
            <TabsTrigger 
              value="trousers" 
              className="rounded-lg font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Trousers
            </TabsTrigger>
            <TabsTrigger 
              value="dhotis" 
              className="rounded-lg font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Dhotis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shirts" className="mt-6">
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
              <Table>
                <TableHeader className="bg-sand/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-cocoa">Age</TableHead>
                    <TableHead className="font-bold text-cocoa">Length</TableHead>
                    <TableHead className="font-bold text-cocoa">Shoulder</TableHead>
                    <TableHead className="text-right font-bold text-cocoa">Chest</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SHIRT_SIZES.map((row) => (
                    <TableRow key={row.age} className="border-b-0 font-medium text-cocoa/80 even:bg-sand/20 hover:bg-sand/30">
                      <TableCell className="font-bold text-cocoa">{row.age}</TableCell>
                      <TableCell>{row.length}</TableCell>
                      <TableCell>{row.shoulder}</TableCell>
                      <TableCell className="text-right">{row.chest}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="trousers" className="mt-6">
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
              <Table>
                <TableHeader className="bg-sand/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-cocoa">Size (Age)</TableHead>
                    <TableHead className="font-bold text-cocoa">Length</TableHead>
                    <TableHead className="text-right font-bold text-cocoa">Waist</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TROUSER_SIZES.map((row) => (
                    <TableRow key={row.size} className="border-b-0 font-medium text-cocoa/80 even:bg-sand/20 hover:bg-sand/30">
                      <TableCell className="font-bold text-cocoa">{row.size}</TableCell>
                      <TableCell>{row.length}</TableCell>
                      <TableCell className="text-right">{row.waist}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="dhotis" className="mt-6">
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
              <Table>
                <TableHeader className="bg-sand/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-cocoa">Age</TableHead>
                    <TableHead className="text-right font-bold text-cocoa">Length (inches)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DHOTI_SIZES.map((row) => (
                    <TableRow key={row.age} className="border-b-0 font-medium text-cocoa/80 even:bg-sand/20 hover:bg-sand/30">
                      <TableCell className="font-bold text-cocoa">{row.age}</TableCell>
                      <TableCell className="text-right">{row.length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-mint/20 p-4 text-sm text-cocoa">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
          <p>
            <strong>How to measure:</strong> Lay a well-fitting garment flat on a table. 
            Measure straight across from side to side for chest and waist. 
            Double the number for the full circumference.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
