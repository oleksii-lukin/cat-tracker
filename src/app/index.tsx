import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

export default function HomeScreen() {
  const [count, setCount] = useState(0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#18181B' }}>
      <Box className="flex-1 justify-center items-center bg-background p-6">
        <VStack space="lg" className="w-full max-w-md items-center">
          <Heading size="2xl" className="text-center text-foreground">
            Welcome to Cat Tracker
          </Heading>
          
          <Text size="md" className="text-center text-muted-foreground">
            A simple demo app built with Expo and gluestack-ui v5
          </Text>

          <VStack space="sm" className="w-full mt-6">
            <Button
              variant="default"
              size="lg"
              onPress={() => setCount((c) => c + 1)}
              className="w-full"
            >
              <ButtonText>Count: {count}</ButtonText>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onPress={() => setCount(0)}
              className="w-full"
            >
              <ButtonText>Reset Counter</ButtonText>
            </Button>
          </VStack>

          <HStack space="md" className="mt-8">
            <Button variant="secondary" size="sm">
              <ButtonText>Secondary</ButtonText>
            </Button>
            <Button variant="ghost" size="sm">
              <ButtonText>Ghost</ButtonText>
            </Button>
          </HStack>

          <Text size="sm" className="text-center text-muted-foreground mt-8">
            Built with Expo SDK 57 + gluestack-ui v5 + NativeWind
          </Text>
        </VStack>
      </Box>
    </SafeAreaView>
  );
}
