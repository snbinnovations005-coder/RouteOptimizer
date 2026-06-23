import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateCacheKey(body: any) {
  const str = JSON.stringify({
    origin: body.origin,
    destination: body.destination,
    intermediates: body.intermediates
  });
  return crypto.createHash('md5').update(str).digest('hex');
}

export async function POST(req: Request) {
  const body = await req.json();
  const cacheKey = generateCacheKey(body);

  // Check cache
  const cachedRoute = await prisma.route.findUnique({
    where: { cacheKey }
  });

  if (cachedRoute) {
    console.log("Cache hit for route!");
    return Response.json({
      routes: [{
        distanceMeters: cachedRoute.totalDistance,
        duration: `${cachedRoute.totalDuration}s`,
        polyline: { encodedPolyline: cachedRoute.encodedPolyline },
        optimizedIntermediateWaypointIndex: cachedRoute.orderedPath,
      }]
    }, { status: 200 });
  }

  console.log("Cache miss. Fetching from Google Maps API...");
  // Not cached, fetch from Google Maps
  const res = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,
        "X-Goog-FieldMask": "routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration,routes.optimizedIntermediateWaypointIndex",
      },
      // Exclude custom meta fields from google request
      body: JSON.stringify({
        origin: body.origin,
        destination: body.destination,
        intermediates: body.intermediates,
        travelMode: body.travelMode,
        optimizeWaypointOrder: body.optimizeWaypointOrder,
        routingPreference: body.routingPreference
      }),
    }
  );

  const data = await res.json();

  // Save to cache
  const route = data.routes?.[0];
  if (res.ok && route) {
    const totalDistance = route.distanceMeters ?? 0;
    const totalDuration = parseInt(route.duration?.replace("s", "") ?? "0", 10);
    const encodedPolyline = route.polyline?.encodedPolyline ?? "";
    const orderedPath = route.optimizedIntermediateWaypointIndex ?? [];

    const saveRoute = prisma.route.create({
      data: {
        cacheKey,
        totalDistance,
        totalDuration,
        encodedPolyline,
        orderedPath,
      }
    });

    const logApi = prisma.apiLog.create({
      data: {
        apiName: "Routes API",
        endpoint: "https://routes.googleapis.com/directions/v2:computeRoutes",
      }
    });

    const locationsMetadata = body.locationsMetadata;
    if (locationsMetadata && Array.isArray(locationsMetadata)) {
      const saveLocations = prisma.location.createMany({
        data: locationsMetadata.map((loc: any) => ({
          name: loc.name || loc.raw || "",
          lat: loc.lat,
          lng: loc.lng,
          label: loc.label,
        }))
      });
      await prisma.$transaction([saveLocations, saveRoute, logApi]);
    } else {
      await prisma.$transaction([saveRoute, logApi]);
    }
  }

  return Response.json(data, { status: res.status });
}
