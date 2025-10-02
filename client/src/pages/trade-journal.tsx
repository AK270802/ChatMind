import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Upload, Download, Edit, Trash2, CloudUpload, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const tradeFormSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  type: z.enum(["long", "short"]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  entryPrice: z.number().min(0.01, "Entry price must be positive"),
  exitPrice: z.number().min(0.01).optional(),
  stopLoss: z.number().min(0.01).optional(),
  takeProfit: z.number().min(0.01).optional(),
  entryDate: z.string().min(1, "Entry date is required"),
  exitDate: z.string().optional(),
  notes: z.string().optional(),
  strategy: z.string().optional(),
  status: z.enum(["open", "closed"]).default("open")
});

type TradeFormData = z.infer<typeof tradeFormSchema>;

interface Trade {
  id: string;
  symbol: string;
  type: "long" | "short";
  quantity: number;
  entryPrice: string;
  exitPrice: string | null;
  stopLoss: string | null;
  takeProfit: string | null;
  pnl: string | null;
  entryDate: string;
  exitDate: string | null;
  notes: string | null;
  strategy: string | null;
  status: string;
  createdAt: string;
}

export default function TradeJournal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    symbol: "",
    type: "",
    dateRange: "",
    result: ""
  });

  const { data: trades = [], isLoading, refetch } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  const createTradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => {
      console.log('Creating trade with data:', data);
      const payload = {
        symbol: data.symbol,
        type: data.type,
        quantity: data.quantity,
        entryPrice: data.entryPrice.toString(),
        exitPrice: data.exitPrice ? data.exitPrice.toString() : null,
        stopLoss: data.stopLoss ? data.stopLoss.toString() : null,
        takeProfit: data.takeProfit ? data.takeProfit.toString() : null,
        entryDate: (() => {
          const date = new Date(data.entryDate);
          return isNaN(date.getTime()) ? new Date() : date;
        })(),
        exitDate: data.exitDate ? (() => {
          const date = new Date(data.exitDate);
          return isNaN(date.getTime()) ? null : date;
        })() : null,
        status: data.status,
        notes: data.notes || null,
        strategy: data.strategy || null,
        pnl: data.exitPrice && data.type === "long" && data.entryPrice
          ? ((data.exitPrice - data.entryPrice) * (data.quantity || 0)).toString()
          : data.exitPrice && data.type === "short" && data.entryPrice
          ? ((data.entryPrice - data.exitPrice) * (data.quantity || 0)).toString()
          : null
      };
      console.log('Sending payload to API:', payload);
      const response = await apiRequest("POST", "/api/trades", payload);
      console.log('Response from API:', response);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      setIsTradeModalOpen(false);
      setEditingTrade(null);
      form.reset();
      toast({ title: "Trade created successfully" });
    },
    onError: (error: Error) => {
      console.error('Error creating trade:', error);
      toast({ title: "Failed to add trade", description: error.message, variant: "destructive" });
    }
  });

  const updateTradeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TradeFormData> }) => {
      const tradeData = {
        ...data,
        entryPrice: data.entryPrice?.toString(),
        exitPrice: data.exitPrice?.toString() || null,
        stopLoss: data.stopLoss?.toString() || null,
        takeProfit: data.takeProfit?.toString() || null,
        entryDate: data.entryDate ? (() => {
          const date = new Date(data.entryDate);
          return isNaN(date.getTime()) ? undefined : date.toISOString();
        })() : undefined,
        exitDate: data.exitDate ? (() => {
          const date = new Date(data.exitDate);
          return isNaN(date.getTime()) ? null : date.toISOString();
        })() : null,
        pnl: data.exitPrice && data.type === "long" && data.entryPrice
          ? ((data.exitPrice - data.entryPrice) * (data.quantity || 0)).toString()
          : data.exitPrice && data.type === "short" && data.entryPrice
          ? ((data.entryPrice - data.exitPrice) * (data.quantity || 0)).toString()
          : null
      };
      
      const res = await apiRequest("PATCH", `/api/trades/${id}`, tradeData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Trade updated successfully" });
      setIsTradeModalOpen(false);
      setEditingTrade(null);
      form.reset();
    }
  });

  const deleteTradeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/trades/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Trade deleted successfully" });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/trades/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: `Successfully imported ${data.trades?.length || 0} trades` });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
  });

  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      symbol: "",
      type: "long",
      quantity: 1,
      entryPrice: 0.01,
      entryDate: new Date().toISOString().split('T')[0],
      status: "open"
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/trades/template', {
        credentials: 'include'
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'trade_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({ title: "Failed to download template", variant: "destructive" });
    }
  };

  const onSubmit = (data: TradeFormData) => {
    console.log('Form submitted with data:', data);
    if (editingTrade) {
      console.log('Updating trade:', editingTrade.id, data);
      updateTradeMutation.mutate({ id: editingTrade.id, data });
    } else {
      console.log('Creating new trade:', data);
      createTradeMutation.mutate(data);
    }
  };

  const filteredTrades = trades.filter(trade => {
    if (filters.symbol && filters.symbol !== "all" && !trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) return false;
    if (filters.type && filters.type !== "all" && trade.type !== filters.type) return false;
    if (filters.result === "winners" && (!trade.pnl || Number(trade.pnl) <= 0)) return false;
    if (filters.result === "losers" && (!trade.pnl || Number(trade.pnl) >= 0)) return false;
    return true;
  });

  const openEditModal = (trade: Trade) => {
    setEditingTrade(trade);
    form.reset({
      symbol: trade.symbol,
      type: trade.type,
      quantity: trade.quantity,
      entryPrice: Number(trade.entryPrice),
      exitPrice: trade.exitPrice ? Number(trade.exitPrice) : undefined,
      stopLoss: trade.stopLoss ? Number(trade.stopLoss) : undefined,
      takeProfit: trade.takeProfit ? Number(trade.takeProfit) : undefined,
      entryDate: trade.entryDate ? new Date(trade.entryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      exitDate: trade.exitDate ? new Date(trade.exitDate).toISOString().split('T')[0] : undefined,
      notes: trade.notes || "",
      strategy: trade.strategy || "",
      status: trade.status as "open" | "closed"
    });
    setIsTradeModalOpen(true);
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Trade Journal</h1>
          <div className="flex space-x-4">
            <Dialog open={isTradeModalOpen} onOpenChange={setIsTradeModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-500">
                  <Plus className="h-4 w-4 mr-2" />
                  New Trade
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] glass border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">{editingTrade ? "Edit Trade" : "Add New Trade"}</DialogTitle>
                  <DialogDescription className="text-gray-300">
                    {editingTrade ? "Update the details of your existing trade." : "Enter the details of your new trade below."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="symbol" className="text-white">Symbol</Label>
                      <Input
                        id="symbol"
                        {...form.register("symbol")}
                        className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-300"
                        placeholder="AAPL"
                      />
                      {form.formState.errors.symbol && (
                        <p className="text-sm text-red-400 mt-1">{form.formState.errors.symbol.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="type" className="text-white">Type</Label>
                      <Controller
                        name="type"
                        control={form.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="bg-slate-800 border-slate-600 text-white data-[placeholder]:text-gray-300 placeholder:text-gray-300 [&_[data-placeholder]]:text-gray-300">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="long">Long</SelectItem>
                              <SelectItem value="short">Short</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {form.formState.errors.type && (
                        <p className="text-sm text-red-400 mt-1">{form.formState.errors.type.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity" className="text-white">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        {...form.register("quantity", { valueAsNumber: true })}
                        className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="entryPrice" className="text-white">Entry Price</Label>
                      <Input
                        id="entryPrice"
                        type="number"
                        step="0.01"
                        {...form.register("entryPrice", { valueAsNumber: true })}
                        className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="exitPrice" className="text-white">Exit Price (Optional)</Label>
                      <Input
                        id="exitPrice"
                        type="number"
                        step="0.01"
                        {...form.register("exitPrice", { valueAsNumber: true })}
                        className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status" className="text-white">Status</Label>
                      <Controller
                        name="status"
                        control={form.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="bg-slate-800 border-slate-600 text-white data-[placeholder]:text-gray-300 placeholder:text-gray-300 [&_[data-placeholder]]:text-gray-300">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {form.formState.errors.status && (
                        <p className="text-sm text-red-400 mt-1">{form.formState.errors.status.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stopLoss" className="text-white">Stop Loss (Optional)</Label>
                      <Input
                        id="stopLoss"
                        type="number"
                        step="0.01"
                        {...form.register("stopLoss", { valueAsNumber: true })}
                        className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="takeProfit" className="text-white">Take Profit (Optional)</Label>
                      <Input
                        id="takeProfit"
                        type="number"
                        step="0.01"
                        {...form.register("takeProfit", { valueAsNumber: true })}
                        className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="entryDate" className="text-white">Entry Date</Label>
                      <Input
                        id="entryDate"
                        type="date"
                        {...form.register("entryDate")}
                        className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="exitDate" className="text-white">Exit Date (Optional)</Label>
                      <Input
                        id="exitDate"
                        type="date"
                        {...form.register("exitDate")}
                        className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="strategy" className="text-white">Strategy (Optional)</Label>
                    <Input
                      id="strategy"
                      {...form.register("strategy")}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-300"
                      placeholder="Momentum, Breakout, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-white">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      {...form.register("notes")}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-300"
                      placeholder="Trade thoughts, lessons learned..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsTradeModalOpen(false);
                        setEditingTrade(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-500"
                      disabled={createTradeMutation.isPending || updateTradeMutation.isPending}
                    >
                      {editingTrade ? "Update Trade" : "Add Trade"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="border-slate-600 hover:bg-slate-700/50">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </SheetTrigger>
              <SheetContent className="glass border-white/10">
                <SheetHeader>
                  <SheetTitle className="text-white">Import Trades</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CloudUpload className="h-8 w-8 text-blue-400" />
                    </div>
                    <p className="text-slate-300 mb-4">Upload your CSV/Excel file</p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Select File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-slate-400 mb-4">Need a template?</p>
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Filters */}
        <Card className="glass border-white/10 mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Select onValueChange={(value) => setFilters(prev => ({ ...prev, symbol: value }))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white data-[placeholder]:text-gray-300 placeholder:text-gray-300 [&_[data-placeholder]]:text-gray-300">
                  <SelectValue placeholder="All Symbols" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Symbols</SelectItem>
                  {Array.from(new Set(trades.map(t => t.symbol))).map(symbol => (
                    <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white data-[placeholder]:text-gray-300 placeholder:text-gray-300 [&_[data-placeholder]]:text-gray-300">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white data-[placeholder]:text-gray-300 placeholder:text-gray-300 [&_[data-placeholder]]:text-gray-300">
                  <SelectValue placeholder="Last 30 Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => setFilters(prev => ({ ...prev, result: value }))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white data-[placeholder]:text-gray-300 placeholder:text-gray-300 [&_[data-placeholder]]:text-gray-300">
                  <SelectValue placeholder="All Results" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="winners">Winners</SelectItem>
                  <SelectItem value="losers">Losers</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="border-slate-600 hover:bg-slate-700/50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trade List */}
        <Card className="glass border-white/10">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8">Loading trades...</div>
            ) : filteredTrades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400">
                        <Checkbox />
                      </th>
                      <th className="text-left py-3 px-4 text-slate-400">Symbol</th>
                      <th className="text-left py-3 px-4 text-slate-400">Type</th>
                      <th className="text-left py-3 px-4 text-slate-400">Quantity</th>
                      <th className="text-left py-3 px-4 text-slate-400">Entry Price</th>
                      <th className="text-left py-3 px-4 text-slate-400">Exit Price</th>
                      <th className="text-left py-3 px-4 text-slate-400">P&L</th>
                      <th className="text-left py-3 px-4 text-slate-400">Date</th>
                      <th className="text-left py-3 px-4 text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.map((trade) => (
                      <tr key={trade.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <Checkbox />
                        </td>
                        <td className="py-3 px-4 font-semibold">{trade.symbol}</td>
                        <td className="py-3 px-4">
                          <Badge
                          variant={trade.type === "long" ? "default" : "secondary"}
                          className={
                            trade.type === "long"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }
                        >
                          {trade.type ? trade.type.charAt(0).toUpperCase() + trade.type.slice(1) : "N/A"}
                        </Badge>
                        </td>
                        <td className="py-3 px-4">{trade.quantity || 0}</td>
                        <td className="py-3 px-4">
                          {trade.entryPrice && !isNaN(Number(trade.entryPrice)) ? `$${Number(trade.entryPrice).toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          {trade.exitPrice && !isNaN(Number(trade.exitPrice)) ? `$${Number(trade.exitPrice).toFixed(2)}` : '-'}
                        </td>
                        <td className={`py-3 px-4 ${trade.pnl && Number(trade.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trade.pnl && !isNaN(Number(trade.pnl)) ? `${Number(trade.pnl) >= 0 ? '+' : ''}$${Number(trade.pnl).toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {(() => {
                            const date = new Date(trade.entryDate);
                            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                          })()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditModal(trade)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTradeMutation.mutate(trade.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <CloudUpload className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No trades found</h3>
                <p className="text-slate-400 mb-6">Start adding trades or upload a CSV file to get started</p>
                <div className="space-x-4">
                  <Button onClick={() => setIsTradeModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Trade
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
