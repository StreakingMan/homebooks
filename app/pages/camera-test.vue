<script setup lang="ts">
import { useDevicesList, useUserMedia } from '@vueuse/core';
import { $fetch } from 'ofetch';
import { QrcodeStream } from 'vue-qrcode-reader';

const books = ref<Record<string, any>>({});

const result = ref('');
const onDetect = (detectedCodes) => {
  console.log(detectedCodes);

  result.value = JSON.stringify(detectedCodes.map((code) => code.rawValue));
  for (const detectedCode of detectedCodes) {
    const isbn = detectedCode.rawValue;
    if (books.value[isbn]) {
      continue;
    }
    $fetch(`/api/books/${isbn}`, {
      method: 'get',
    }).then((res) => {
      books.value = { ...books.value, [isbn]: res };
    });
  }
};

const currentCamera = ref<string>();
const { videoInputs: cameras } = useDevicesList({
  requestPermissions: true,
  onUpdated() {
    if (!cameras.value.find((i) => i.deviceId === currentCamera.value)) currentCamera.value = cameras.value[0]?.deviceId;
  },
});

const video = ref<HTMLVideoElement>();
const { stream, enabled } = useUserMedia({
  constraints: reactive({ video: { deviceId: currentCamera } }),
});

watchEffect(() => {
  if (video.value) video.value.srcObject = stream.value!;
});

/*const paintOutline = (detectedCodes, ctx) => {
  for (const detectedCode of detectedCodes) {
    const [firstPoint, ...otherPoints] = detectedCode.cornerPoints;

    ctx.strokeStyle = 'red';

    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);
    for (const { x, y } of otherPoints) {
      ctx.lineTo(x, y);
    }
    ctx.lineTo(firstPoint.x, firstPoint.y);
    ctx.closePath();
    ctx.stroke();
  }
};*/
</script>

<template>
  <div class="m-4">
    <ClientOnly>
      <div class="mx-auto size-[50vw]">
        <qrcode-stream :formats="['ean_13']" @detect="onDetect" />
      </div>
    </ClientOnly>
    <div class="flex flex-col gap-4 text-center">
      <div>
        <button @click="enabled = !enabled">
          {{ enabled ? 'Stop' : 'Start' }}
        </button>
      </div>

      <div>
        <div
          v-for="camera of cameras"
          :key="camera.deviceId"
          class="px-2 py-1 cursor-pointer"
          :class="{ 'text-primary': currentCamera === camera.deviceId }"
          @click="currentCamera = camera.deviceId"
        >
          {{ camera.label }}
        </div>
      </div>
      <div>
        <video ref="video" muted autoplay controls class="h-100 w-auto" />
      </div>
    </div>
    <p class="decode-result">
      Last result: <b>{{ result }}</b>
    </p>
    <div class="grid h-[50vh] grid-cols-3 gap-4 overscroll-y-auto">
      <div v-for="(book, isbn) in books" :key="isbn" class="border p-4">
        <h2>{{ book.title }}</h2>
        <p>{{ book.author }}</p>
        <img :src="book.img" alt="cover" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
