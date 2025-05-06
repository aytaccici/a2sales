import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, TooltipProps as RechartsTooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface SalesData {
  yil: number;
  ay: number;
  ay_adi: string;
  hafta: number;
  toplam_tutar: string;
}

interface YearlySummary {
  yil: number;
  toplam: string;
}

interface MonthlySummary {
  yil: number;
  ay: number;
  ay_adi: string;
  toplam: string;
}

interface YearlyGrowth {
  yil: number;
  artisOrani: string;
}

interface CustomTooltipProps extends RechartsTooltipProps<ValueType, NameType> {
  payload?: Array<{
    value: number;
    payload: SalesData;
  }>;
}

interface TooltipValue {
  value: number | string;
  payload: any;
}

const SalesAnalysis = () => {
  const [data, setData] = useState<SalesData[]>([]);
  const [yearlySummary, setYearlySummary] = useState<YearlySummary[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [selectedView, setSelectedView] = useState<'yearly' | 'monthly' | 'weekly'>('yearly');
  
  // Veriyi yükle
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Fetching data from /satis_verileri.json');
        const response = await fetch('/satis_verileri.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const parsedData: SalesData[] = await response.json();
        console.log('Loaded data:', parsedData);
        
        if (!Array.isArray(parsedData) || parsedData.length === 0) {
          throw new Error('Loaded data is not a valid array or is empty');
        }
        
        setData(parsedData);
        
        // Mevcut yılları belirle
        const uniqueYears = Array.from(new Set(parsedData.map(item => item.yil))).sort();
        console.log('Unique years:', uniqueYears);
        
        setYears(uniqueYears);
        setSelectedYear(uniqueYears[uniqueYears.length - 1]); // En son yılı seç
        
        // Yıllık özeti hesapla
        const yearSummary = uniqueYears.map(year => {
          const yearData = parsedData.filter(item => item.yil === year);
          const total = yearData.reduce((sum, item) => sum + parseFloat(item.toplam_tutar.replace(/,/g, '')), 0);
          return {
            yil: year,
            toplam: total.toFixed(2)
          };
        });
        setYearlySummary(yearSummary);
        
        // Aylık özeti hesapla (tüm yıllar için)
        const monthSummary: MonthlySummary[] = [];
        uniqueYears.forEach(year => {
          for (let month = 1; month <= 12; month++) {
            const monthData = parsedData.filter(item => item.yil === year && item.ay === month);
            if (monthData.length > 0) {
              const total = monthData.reduce((sum, item) => sum + parseFloat(item.toplam_tutar.replace(/,/g, '')), 0);
              monthSummary.push({
                yil: year,
                ay: month,
                ay_adi: monthData[0].ay_adi,
                toplam: total.toFixed(2)
              });
            }
          }
        });
        setMonthlySummary(monthSummary);
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
      }
    };
    
    loadData();
  }, []);

  // ... Diğer kodlar aynen kalacak ...
  
  // Seçilen yıla göre filtrelenmiş aylık veri
  const filteredMonthlyData = monthlySummary.filter(item => item.yil === selectedYear)
    .sort((a, b) => a.ay - b.ay);
    
  // Seçilen yıla göre haftalık veri
  const filteredWeeklyData = data.filter(item => item.yil === selectedYear)
    .sort((a, b) => {
      // Önce aya göre sırala
      if (a.ay !== b.ay) {
        return a.ay - b.ay;
      }
      // Aynı ayda ise haftaya göre sırala
      return a.hafta - b.hafta;
    });

  console.log('Selected Year:', selectedYear);
  console.log('All Data:', data);
  console.log('Filtered Weekly Data:', filteredWeeklyData);
  
  // Yıllık satışlardaki artış oranı
  const yearlyGrowthRate: YearlyGrowth[] = [];
  for (let i = 1; i < yearlySummary.length; i++) {
    const prevYear = parseFloat(yearlySummary[i-1].toplam);
    const currentYear = parseFloat(yearlySummary[i].toplam);
    const growthRate = ((currentYear - prevYear) / prevYear * 100).toFixed(2);
    yearlyGrowthRate.push({
      yil: yearlySummary[i].yil,
      artisOrani: growthRate
    });
  }
  
  const formatCurrency = (value: unknown): string => {
    if (value === undefined || value === null) return '₺0,00';
    
    let numValue: number;
    if (typeof value === 'string') {
      numValue = parseFloat(value.replace(/,/g, ''));
    } else if (typeof value === 'number') {
      numValue = value;
    } else {
      return '₺0,00';
    }
    
    if (isNaN(numValue)) return '₺0,00';
    
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 2 
    }).format(numValue);
  };
  
  // YearSelector bileşeni
  const YearSelector = () => (
    <div className="flex justify-center mb-4">
      <select 
        value={selectedYear || ''} 
        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        className="p-2 border border-gray-300 rounded"
      >
        {years.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
  );
  
  // ViewSelector bileşeni
  const ViewSelector = () => (
    <div className="flex justify-center mb-4">
      <div className="flex space-x-4">
        <button 
          onClick={() => setSelectedView('yearly')} 
          className={`px-4 py-2 rounded ${selectedView === 'yearly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Yıllık Görünüm
        </button>
        <button 
          onClick={() => setSelectedView('monthly')} 
          className={`px-4 py-2 rounded ${selectedView === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Aylık Görünüm
        </button>
        <button 
          onClick={() => setSelectedView('weekly')} 
          className={`px-4 py-2 rounded ${selectedView === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Haftalık Görünüm
        </button>
      </div>
    </div>
  );
  
  // YearlyView bileşeni
  const YearlyView = () => {
    // Yıllık verilerin maksimum değerini bul
    const maxYearlyValue = Math.max(...yearlySummary.map(item => parseFloat(item.toplam)));
    const yAxisDomain = [0, Math.ceil(maxYearlyValue * 1.1)]; // %10 ekstra alan

    return (
      <div>
        <h2 className="text-xl font-bold mb-4 text-center">Yıllık Toplam Satışlar</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlySummary}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="yil" 
                label={{ value: 'Yıl', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                domain={yAxisDomain}
                tickFormatter={(value) => formatCurrency(value)}
                label={{ value: 'Toplam Satış', angle: -90, position: 'insideLeft', offset: 10 }}
              />
              <Tooltip formatter={(value: unknown) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="toplam" fill="#8884d8" name="Toplam Satış" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-center">Yıllık Satış İstatistikleri</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Yıl</th>
                  <th className="border px-4 py-2">Toplam Satış</th>
                  <th className="border px-4 py-2">Artış Oranı</th>
                </tr>
              </thead>
              <tbody>
                {yearlySummary.map((item, index) => {
                  const growthRate = yearlyGrowthRate.find(yr => yr.yil === item.yil);
                  const artisOrani = growthRate?.artisOrani || '0';
                  const isPositive = parseFloat(artisOrani) >= 0;
                  
                  return (
                    <tr key={item.yil}>
                      <td className="border px-4 py-2">{item.yil}</td>
                      <td className="border px-4 py-2 text-right">{formatCurrency(item.toplam)}</td>
                      <td className="border px-4 py-2 text-right">
                        {index > 0 ? (
                          <span className={`${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{artisOrani}%
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Büyüme Oranı Grafiği */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-center">Yıllık Büyüme Oranları</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyGrowthRate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="yil" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="artisOrani" fill="#ff7300" name="Artış Oranı (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };
  
  // MonthlyView bileşeni
  const MonthlyView = () => {
    // Aylık verilerin maksimum değerini bul
    const maxMonthlyValue = Math.max(...filteredMonthlyData.map(item => parseFloat(item.toplam)));
    const yAxisDomain = [0, Math.ceil(maxMonthlyValue * 1.1)]; // %10 ekstra alan

    return (
      <div>
        <YearSelector />
        <h2 className="text-xl font-bold mb-4 text-center">{selectedYear} Yılı Aylık Satışlar</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="ay_adi" 
                label={{ value: 'Ay', position: 'insideBottom', offset: -5 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={yAxisDomain}
                tickFormatter={(value) => formatCurrency(value)}
                label={{ value: 'Toplam Satış', angle: -90, position: 'insideLeft', offset: 10 }}
              />
              <Tooltip formatter={(value: unknown) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="toplam" fill="#82ca9d" name="Toplam Satış" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-center">{selectedYear} Yılı Aylık Satış İstatistikleri</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Ay</th>
                  <th className="border px-4 py-2">Toplam Satış</th>
                </tr>
              </thead>
              <tbody>
                {filteredMonthlyData.map(item => (
                  <tr key={`${item.yil}-${item.ay}`}>
                    <td className="border px-4 py-2">{item.ay_adi}</td>
                    <td className="border px-4 py-2 text-right">{formatCurrency(item.toplam)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="border px-4 py-2">Toplam</td>
                  <td className="border px-4 py-2 text-right">
                    {formatCurrency(filteredMonthlyData.reduce((sum, item) => 
                      sum + parseFloat(item.toplam), 0
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border shadow-md">
          <p className="font-bold">{`${selectedYear} - Hafta ${label} (${data.ay_adi})`}</p>
          <p>{`Satış: ${formatCurrency(data.toplam_tutar)}`}</p>
        </div>
      );
    }
    return null;
  };
  
  // WeeklyView bileşeni
  const WeeklyView = () => {
    // Seçilen yıla göre haftalık veriyi yeniden hesapla
    const weeklyData = data
      .filter(item => item.yil === selectedYear)
      .sort((a, b) => {
        if (a.ay !== b.ay) return a.ay - b.ay;
        return a.hafta - b.hafta;
      })
      .map(item => ({
        ...item,
        toplam_tutar: parseFloat(item.toplam_tutar.replace(/,/g, ''))
      }));

    console.log('Weekly View Data:', weeklyData);

    // Haftalık verilerin maksimum değerini bul
    const maxWeeklyValue = Math.max(...weeklyData.map(item => item.toplam_tutar));
    const yAxisDomain = [0, Math.ceil(maxWeeklyValue * 1.1)]; // %10 ekstra alan

    return (
      <div>
        <YearSelector />
        <h2 className="text-xl font-bold mb-4 text-center">{selectedYear} Yılı Haftalık Satışlar</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hafta" 
                label={{ value: 'Hafta', position: 'insideBottom', offset: -5 }}
                tickFormatter={(value) => `Hafta ${value}`}
              />
              <YAxis 
                domain={yAxisDomain}
                tickFormatter={(value) => formatCurrency(value)}
                label={{ value: 'Toplam Satış', angle: -90, position: 'insideLeft', offset: 10 }}
              />
              <Tooltip 
                formatter={(value: any) => formatCurrency(value)}
                labelFormatter={(label) => `${selectedYear} - Hafta ${label}`}
              />
              <Legend />
              <Bar dataKey="toplam_tutar" fill="#8884d8" name="Haftalık Satış">
                {weeklyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${entry.ay * 30}, 70%, 60%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Haftalık verilerin aylık grupları */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-center">{selectedYear} Yılı - Aylara Göre Haftalık Satışlar</h2>
          {weeklyData.length > 0 ? (
            Array.from(new Set(weeklyData.map(item => item.ay))).map(month => {
              const weeklyDataForMonth = weeklyData.filter(item => item.ay === month);
              const monthName = weeklyDataForMonth[0]?.ay_adi;
              
              return (
                <div key={`${selectedYear}-${month}`} className="mb-8 border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">{monthName} ({month}. Ay)</h3>
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyDataForMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="hafta" 
                          label={{ value: 'Hafta No', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          label={{ value: 'Satış Tutarı', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(value)}
                          labelFormatter={(label) => `${selectedYear} - Hafta ${label}`}
                        />
                        <Bar dataKey="toplam_tutar" fill="#82ca9d" name="Haftalık Satış" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                      <thead>
                        <tr>
                          <th className="border px-4 py-2">Hafta</th>
                          <th className="border px-4 py-2">Satış Tutarı</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyDataForMonth.map(week => (
                          <tr key={`${week.yil}-${week.ay}-${week.hafta}`}>
                            <td className="border px-4 py-2 text-center">Hafta {week.hafta}</td>
                            <td className="border px-4 py-2 text-right">{formatCurrency(week.toplam_tutar)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-100 font-bold">
                          <td className="border px-4 py-2">Toplam</td>
                          <td className="border px-4 py-2 text-right">
                            {formatCurrency(weeklyDataForMonth.reduce((sum, item) => 
                              sum + item.toplam_tutar, 0
                            ))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center p-4 bg-gray-100 rounded">
              <p>Seçilen yıl için veri bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Satış Analizi Gösterge Paneli</h1>
      
      <ViewSelector />
      
      {selectedView === 'yearly' && <YearlyView />}
      {selectedView === 'monthly' && <MonthlyView />}
      {selectedView === 'weekly' && <WeeklyView />}
    </div>
  );
};

export default SalesAnalysis; 