'use client'
import Container from "@/components/Container";
import ForecastWeatherDetail from "@/components/ForecastWeatherDetail";
import Navbar from "@/components/Navbar";
import WeatherDetails from "@/components/WeatherDetails";
import WeatherIcon from "@/components/WeatherIcon";
import { convertKelvinToCelsius } from "@/utils/convertKalvinToCelsius";
import { convertWindSpeed } from "@/utils/convertWindSpeed";
import { getDayOrNightIcon } from "@/utils/getDayOrNightIcon";
import { meterToKilometers } from "@/utils/metersToKilometers";
import axios from "axios";
import { format, fromUnixTime, parseISO } from "date-fns";
import { useQuery } from "react-query";
import { loadingCityAtom, placeAtom } from "./atom";
import { useAtom } from "jotai";
import {  useEffect } from "react";

// https://api.openweathermap.org/data/2.5/forecast?q=${place}&appid=${process.env.NEXT_PUBLIC_WEATHER_KEY}&cnt=56

interface WeatherData {
  cod: string;
  message: number;
  cnt: number;
  list: WeatherListItem[];
  city: CityInfo;
}

interface WeatherListItem {
  dt: number;
  main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      sea_level: number;
      grnd_level: number;
      humidity: number;
      temp_kf: number;
  };
  weather: Weather[];
  clouds: {
      all: number;
  };
  wind: {
      speed: number;
      deg: number;
      gust: number;
  };
  visibility: number;
  pop: number;
  sys: {
      pod: string;
  };
  dt_txt: string;
}

interface Weather {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface CityInfo {
  id: number;
  name: string;
  coord: {
      lat: number;
      lon: number;
  };
  country: string;
  population: number;
  timezone: number;
  sunrise: number;
  sunset: number;
}
export default function Home() {
  const [place, setPlace] = useAtom(placeAtom);
  const [loadingCity, ] = useAtom(loadingCityAtom);

  const { isLoading, error, data, refetch } = useQuery<WeatherData>('repoData', async () => {
    const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${place}&appid=${process.env.NEXT_PUBLIC_WEATHER_KEY}&cnt=56`)
    return data
    }
  );

  useEffect(() => {
    refetch();
  }, [place, refetch])
  

  const firstData = data?.list[0]
  console.log("data", data);

  const uniqueDates = [
    ...new Set(
      data?.list.map(
        (entry) => new Date(entry.dt * 1000).toISOString().split("T")[0]
      )
    )
  ];
  const firstDataForEachDate = uniqueDates.map((date) => {
    return data?.list.find((entry) => {
      const entryDate = new Date(entry.dt * 1000).toISOString().split("T")[0];
      const entryTime = new Date(entry.dt * 1000).getHours();
      return entryDate === date && entryTime >= 6;
    });
  });
  
  if (isLoading) return (
    
      <div className="flex items-center min-h-screen justify-center">
        <p className="animate-bounce">Loading...</p>
      </div>
    
  )
  return (
    <div className="flex flex-col gap-4 bg-gray-100 min-h-screen">
      <Navbar location={data?.city.name} />
      <main className="px-3 max-w-7xl mx-auto flex flex-col gap-9 w-full pb-10 pt-4">
        {/* today data */}

        { loadingCity ? <WeatherSkeleton /> :

        <>
          <section className="space-y-4">
            <div className="space-y-2">
              <h2 className="flex gap-1 text-2xl items-end">
                <p>{format(parseISO(firstData?.dt_txt ?? ''), "EEEE")}</p>
                <p className="text-lg">{format(parseISO(firstData?.dt_txt ?? ""), "dd.MM.yyyy")}</p>
              </h2>
              <Container className="gap-10 px-6 items-center" >
                {/* temperature */}
                <div className="flex flex-col px-4">
                  <span className="text-5xl">
                    {convertKelvinToCelsius(firstData?.main.temp ?? 296.37)}°
                  </span>
                  <p className="text-xs space-x-1 whitespace-nowrap">
                    <span> Feels like</span>
                    <span>
                    {convertKelvinToCelsius(firstData?.main.feels_like ?? 0)}°
                    </span>
                  </p>
                  <p className="text-xs space-x-2">
                    <span>
                      {convertKelvinToCelsius(firstData?.main.temp_min ?? 0)}°↓{" "}
                    </span>
                    <span>
                      {convertKelvinToCelsius(firstData?.main.temp_max ?? 0)}°↑{" "}
                    </span>

                  </p>
                </div>
                {/* time and weather icon */}
                <div className="flex gap-10 sm:gap-16 overflow-x-auto w-full justify-between pr-3">
                  {
                    data?.list.map((d, i) => {
                      return (
                        <div key={i} className="flex flex-col justify-between gap-2 items-center text-xs font-semibold">
                          <p className="whitespace-nowrap">
                            {format(parseISO(d.dt_txt), "h:mm a")}

                          </p>
                          {/* <WeatherIcon iconName={d.weather[0].icon}/> */}
                          <WeatherIcon 
                            iconName={getDayOrNightIcon(d.weather[0].icon, d.dt_txt)}
                          />

                          <p>{convertKelvinToCelsius(d?.main.temp ?? 0)}°</p>
                        </div>
                      )
                    })
                  }
                </div>
              </Container>
            </div>
            <div className="flex gap-4">
              {/* left */}
              <Container className="w-fit justify-center flex-col px-4 items-center">
                <p className="capitalize text-center">
                  {firstData?.weather[0].description}
                </p>
                <WeatherIcon 
                  iconName={getDayOrNightIcon(firstData?.weather[0].icon ?? "", firstData?.dt_txt ?? "")}
                />
              </Container>
              <Container className="bg-[#fcf80f]/80 px-6 gap-4 justify-between overflow-x-auto">
                <WeatherDetails 
                  visability={meterToKilometers(firstData?.visibility ?? 10000)} 
                  humidity={`${firstData?.main.humidity}%`}
                  windSpeed={convertWindSpeed(firstData?.wind.speed ?? 1.64)}
                  airPressure={`${firstData?.main.pressure} hPa`}
                  sunrise={format(fromUnixTime(data?.city.sunrise ?? 1702949452), "H:m")}
                  sunset={format(fromUnixTime(data?.city.sunset ?? 1702949452), "H:m")}
                />
              </Container>
              {/* right */}
            </div>
          </section>

          {/* 7 days forecast data */}
          <section className="flex w-full flex-col gap-4">
            <p className="text-2xl">Forecast (7 days)</p>
            { firstDataForEachDate.map((d, i) => (

                <ForecastWeatherDetail 
                  key={i}
                  description={d?.weather[0].description ?? ""}
                  weatherIcon={d?.weather[0].icon ?? "01d"}
                  date={format(parseISO(d?.dt_txt ?? ""), "dd.MM")}
                  day={format(parseISO(d?.dt_txt ?? ""), "EEEE")}
                  feels_like={d?.main.feels_like ?? 0}
                  temp={d?.main.temp ?? 0}
                  temp_max={d?.main.temp_max ?? 0}
                  temp_min={d?.main.temp_min ?? 0}
                  airPressure={`${d?.main.pressure} hPa`}
                  humidity={`${d?.main.humidity}%`}
                  sunrise={format(fromUnixTime(data?.city.sunrise ?? 1702517657), "H:mm")}
                  sunset={format(fromUnixTime(data?.city.sunset ?? 1702517657), "H:mm")}
                  visability={`${meterToKilometers(d?.visibility ?? 10000)} `}
                  windSpeed={`${convertWindSpeed(d?.wind.speed ?? 1.64)}`}
                />
              ))
            }
          </section>
        </>}
      </main>
    </div>
  );
}

function WeatherSkeleton (){
  return (
    <main className="px-3 max-w-7xl mx-auto flex flex-col gap-9 w-full pb-10 pt-4">
      {/* today data */}
      <section className="space-y-4">
        <div className="space-y-2 animate-pulse">
          <h2 className="flex gap-1 text-2xl items-end">
            <p>{/* Skeleton for day of the week */}</p>
            <p className="text-lg">{/* Skeleton for date */}</p>
          </h2>
          <div className="gap-10 px-6 items-center">
            {/* temperature */}
            <div className="flex flex-col px-4">
              <span className="text-5xl">{/* Skeleton for temperature */}</span>
              <p className="text-xs space-x-1 whitespace-nowrap">
                <span> Feels like</span>
                <span>{/* Skeleton for feels like temperature */}</span>
              </p>
              <p className="text-xs space-x-2">
                <span>{/* Skeleton for min temperature */}↓ </span>
                <span>{/* Skeleton for max temperature */}↑ </span>
              </p>
            </div>
            {/* time and weather icon */}
            <div className="flex gap-10 sm:gap-16 overflow-x-auto w-full justify-between pr-3">
              {/* Skeleton for weather details */}
            </div>
          </div>
        </div>
        <div className="flex gap-4 animate-pulse">
          {/* left */}
          <div className="w-fit justify-center flex-col px-4 items-center">
            <p className="capitalize text-center">{/* Skeleton for weather description */}</p>
            {/* Skeleton for weather icon */}
          </div>
          {/* Skeleton for weather details */}
        </div>
      </section>

      {/* 7 days forecast data */}
      <section className="flex w-full flex-col gap-4">
        <p className="text-2xl">Forecast (7 days)</p>
        {/* Skeleton for forecast data */}
      </section>
    </main>

  )
}